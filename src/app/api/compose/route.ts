import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { decrementCreditsAtomically } from "@/lib/credits";
import { verifyWhopFromRequest, getOrCreateAndSyncUser } from "@/lib/auth";
import { whopSdk, plans as whopPlans, passes as whopPasses } from "@/lib/whop";
import { getMusicClient } from "@/lib/music/elevenlabs";
import { JobStatus, Plan } from "@prisma/client";

const composeSchema = z.object({
  vibe: z.string().min(1),
  bpm: z.number().int().min(40).max(220),
  duration: z.number().int().min(5).max(120),
  structure: z.string().min(1),
  seed: z.string().optional(),
  batch: z.number().int().min(1).max(10).default(1),
  stems: z.boolean().default(false),
  vocals: z.boolean().optional(),
  reusePlan: z.boolean().optional(),
  streamingPreview: z.boolean().optional(),
  shareToForum: z.boolean().optional(),
});

type ErrorBody = { error: string; requiredPlan?: "PRO" | "STUDIO"; message?: string; suggestedPrompt?: string };

const bannedPromptTerms = [
  "taylor swift",
  "drake",
  "olivia rodrigo",
  "post malone",
  "weeknd",
  "weekend",
  "bad bunny",
  "billie eilish",
  "dualipa",
  "dua lipa",
  "metallica",
  "beatles",
  "ariana grande",
  "justin bieber",
  "rihanna",
  "lady gaga",
  "eminem",
  "journey",
  "nirvana",
];

const planCaps: Record<Plan, { maxDuration: number; maxBatch: number }> = {
  STARTER: { maxDuration: 30, maxBatch: 2 },
  PRO: { maxDuration: 60, maxBatch: 4 },
  STUDIO: { maxDuration: 120, maxBatch: 10 },
};

const planFeatures: Record<Plan, { allowStems: boolean; allowVocals: boolean; allowReusePlan: boolean }> = {
  STARTER: { allowStems: false, allowVocals: false, allowReusePlan: false },
  PRO: { allowStems: true, allowVocals: true, allowReusePlan: true },
  STUDIO: { allowStems: true, allowVocals: true, allowReusePlan: true },
};

function findBlockedTerm(prompt: string): string | null {
  const normalized = prompt.toLowerCase();
  if (normalized.includes("lyrics")) return "lyrics";
  for (const term of bannedPromptTerms) {
    if (normalized.includes(term)) return term;
  }
  const byPattern = /\bby\s+[a-z0-9\s]+/i;
  if (byPattern.test(prompt)) return "by <artist>";
  return null;
}

async function detectWhopPlan(userId: string): Promise<Plan | null> {
  const expPriority: Array<{ id?: string; plan: Plan }> = [
    { id: whopPlans.STUDIO, plan: Plan.STUDIO },
    { id: whopPlans.PRO, plan: Plan.PRO },
    { id: whopPlans.STARTER, plan: Plan.STARTER },
  ];
  for (const { id, plan } of expPriority) {
    if (!id) continue;
    const access = await whopSdk.access.checkIfUserHasAccessToExperience({ userId, experienceId: id });
    if (access.hasAccess) return plan;
  }
  const passPriority: Array<{ id?: string; plan: Plan }> = [
    { id: whopPasses.STUDIO, plan: Plan.STUDIO },
    { id: whopPasses.PRO, plan: Plan.PRO },
    { id: whopPasses.STARTER, plan: Plan.STARTER },
  ];
  for (const { id, plan } of passPriority) {
    if (!id) continue;
    const access = await whopSdk.access.checkIfUserHasAccessToAccessPass({ userId, accessPassId: id });
    if (access.hasAccess) return plan;
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as unknown;
    const parsed = composeSchema.parse(body);

    const blockedTerm = findBlockedTerm(parsed.vibe);
    if (blockedTerm) {
      return NextResponse.json<ErrorBody>(
        {
          error: "PROMPT_BLOCKED",
          message: `Prompt cannot mention specific artists or lyrics (found: ${blockedTerm}).`,
        },
        { status: 422 },
      );
    }

    const prisma = getPrisma();
    const verified = await verifyWhopFromRequest(req);
    const user = await getOrCreateAndSyncUser(verified.userId, undefined);

    const freeTrialEvent = await prisma.event.findFirst({ where: { userId: user.id, type: "FREE_TRIAL_USED" } });
    const trialEligible = !freeTrialEvent;

    let hasAccess = user.plan !== Plan.STARTER;
    try {
      const detectedPlan = await detectWhopPlan(verified.userId);
      if (detectedPlan && detectedPlan !== user.plan) {
        const baseline = detectedPlan === Plan.STUDIO ? 700 : detectedPlan === Plan.PRO ? 200 : 50;
        const newCredits = Math.max(user.credits, baseline);
        await prisma.user.update({ where: { id: user.id }, data: { plan: detectedPlan, credits: newCredits } });
        user.plan = detectedPlan;
        user.credits = newCredits;
      }
      hasAccess = Boolean(detectedPlan) || user.plan !== Plan.STARTER;
    } catch {
      hasAccess = user.plan !== Plan.STARTER;
    }

    if (!hasAccess && !trialEligible) {
      return NextResponse.json<ErrorBody>({ error: "FORBIDDEN_PAYWALL" }, { status: 403 });
    }

    const userCaps = planCaps[user.plan];
    if (parsed.duration > userCaps.maxDuration) {
      const requiredPlan = parsed.duration <= planCaps.PRO.maxDuration ? "PRO" : "STUDIO";
      return NextResponse.json<ErrorBody>({ error: "UPGRADE_REQUIRED", requiredPlan }, { status: 403 });
    }
    if (parsed.batch > userCaps.maxBatch) {
      const requiredPlan = parsed.batch <= planCaps.PRO.maxBatch ? "PRO" : "STUDIO";
      return NextResponse.json<ErrorBody>({ error: "UPGRADE_REQUIRED", requiredPlan }, { status: 403 });
    }

    const features = planFeatures[user.plan];
    if (parsed.vocals && !features.allowVocals) {
      return NextResponse.json<ErrorBody>({ error: "UPGRADE_REQUIRED", requiredPlan: "PRO" }, { status: 403 });
    }
    if (parsed.stems && !features.allowStems) {
      return NextResponse.json<ErrorBody>({ error: "UPGRADE_REQUIRED", requiredPlan: "PRO" }, { status: 403 });
    }
    if (parsed.reusePlan && !features.allowReusePlan) {
      return NextResponse.json<ErrorBody>({ error: "UPGRADE_REQUIRED", requiredPlan: "PRO" }, { status: 403 });
    }

    const creditUnits = parsed.batch;
    if (hasAccess || !trialEligible) {
      try {
        await decrementCreditsAtomically(user.id, creditUnits);
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        if (message === "INSUFFICIENT_CREDITS") {
          return NextResponse.json<ErrorBody>({ error: "INSUFFICIENT_CREDITS" }, { status: 402 });
        }
        throw e;
      }
    }

    const promptText = parsed.vibe + (parsed.vocals ? ", with vocals" : "");
    const music = getMusicClient();
  const { jobId: remoteJobId } = await music.createGenerateJob({
    prompt: promptText,
    bpm: parsed.bpm,
    duration: parsed.duration,
    structure: parsed.structure,
    seed: parsed.seed,
    stems: parsed.stems,
    variations: parsed.batch,
  });

  await prisma.job.upsert({
    where: { id: remoteJobId },
    create: {
      id: remoteJobId,
      userId: user.id,
      status: JobStatus.QUEUED,
      payloadJson: { ...parsed, prompt: promptText, shareToForum: Boolean(parsed.shareToForum) },
    },
    update: {
      userId: user.id,
      status: JobStatus.QUEUED,
      payloadJson: { ...parsed, prompt: promptText, shareToForum: Boolean(parsed.shareToForum) },
    },
  });

    const response = NextResponse.json({ jobId: remoteJobId, trialUsed: !hasAccess && trialEligible });
    try {
      response.cookies.set("musician_uid", user.id, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax", secure: true });
    } catch {}

    if (!hasAccess && trialEligible) {
      try {
        await prisma.event.create({ data: { userId: user.id, type: "FREE_TRIAL_USED", payloadJson: { at: new Date().toISOString() } } });
      } catch {}
    }

    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN_ERROR";
    return NextResponse.json<ErrorBody>({ error: message }, { status: 400 });
  }
}
