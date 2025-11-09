import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { decrementCreditsAtomically } from "@/lib/credits";
import { verifyWhopFromRequest, getOrCreateAndSyncUser } from "@/lib/auth";
import { getMusicClient } from "@/lib/music/elevenlabs";
import { JobStatus, Plan } from "@prisma/client";
import { fetchEntitledPlan } from "@/lib/entitlements";
import { PLAN_BASELINE_CREDITS, PLAN_CAPS, PLAN_FEATURES, PlanName } from "@/lib/plans";

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

    let resolvedPlan: Plan = user.plan ?? Plan.STARTER;
    try {
      const detectedPlan = await fetchEntitledPlan(verified.userId);
      if (detectedPlan && detectedPlan !== user.plan) {
        const baseline = PLAN_BASELINE_CREDITS[detectedPlan as PlanName];
        const newCredits = Math.max(user.credits, baseline);
        await prisma.user.update({ where: { id: user.id }, data: { plan: detectedPlan, credits: newCredits } });
        user.plan = detectedPlan;
        user.credits = newCredits;
      }
      if (detectedPlan) {
        resolvedPlan = detectedPlan;
      }
    } catch (err) {
      console.error("Failed to sync entitlements", err);
    }

    const planKey = (resolvedPlan ?? Plan.STARTER) as PlanName;
    const hasAccess = planKey !== "STARTER";

    if (!hasAccess && !trialEligible) {
      return NextResponse.json<ErrorBody>({ error: "FORBIDDEN_PAYWALL" }, { status: 403 });
    }

    const userCaps = PLAN_CAPS[planKey];
    if (parsed.duration > userCaps.maxDuration) {
      const requiredPlan = parsed.duration <= PLAN_CAPS.PRO.maxDuration ? "PRO" : "STUDIO";
      return NextResponse.json<ErrorBody>({ error: "UPGRADE_REQUIRED", requiredPlan }, { status: 403 });
    }
    if (parsed.batch > userCaps.maxBatch) {
      const requiredPlan = parsed.batch <= PLAN_CAPS.PRO.maxBatch ? "PRO" : "STUDIO";
      return NextResponse.json<ErrorBody>({ error: "UPGRADE_REQUIRED", requiredPlan }, { status: 403 });
    }

    const features = PLAN_FEATURES[planKey];
    if (parsed.vocals && !features.allowVocals) {
      return NextResponse.json<ErrorBody>({ error: "UPGRADE_REQUIRED", requiredPlan: "PRO" }, { status: 403 });
    }
    if (parsed.stems && !features.allowStems) {
      return NextResponse.json<ErrorBody>({ error: "UPGRADE_REQUIRED", requiredPlan: "PRO" }, { status: 403 });
    }
    if (parsed.reusePlan && !features.allowReusePlan) {
      return NextResponse.json<ErrorBody>({ error: "UPGRADE_REQUIRED", requiredPlan: "PRO" }, { status: 403 });
    }
    if (parsed.streamingPreview && !features.allowStreaming) {
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
