import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { decrementCreditsAtomically } from "@/lib/credits";
import { verifyWhopFromRequest, getOrCreateAndSyncUser } from "@/lib/auth";
import { getStorage } from "@/lib/storage/s3";
import { normalizeLoudness, renderLoopVersion } from "@/lib/processing/audio";
import { env } from "@/lib/env";
import { whopSdk } from "@/lib/whop";
import { Plan } from "@prisma/client";

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
});

type ErrorBody = { error: string };

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as unknown;
    const parsed = composeSchema.parse(body);

    const prisma = getPrisma();
    const verified = await verifyWhopFromRequest(req);
    const user = await getOrCreateAndSyncUser(verified.userId, undefined);

    // One-time free generation for new users (no paywall, no credits charged)
    const freeTrialEvent = await prisma.event.findFirst({ where: { userId: user.id, type: "FREE_TRIAL_USED" } });
    const trialEligible = !freeTrialEvent;

    // Optional Whop access check: prefer Access Pass over Experience
    // If not configured, skip instead of failing
    const starterPassId = process.env.WHOP_PASS_STARTER_ID as string | undefined;
    let hasAccess = true;
    if (starterPassId) {
      try {
        const access = await whopSdk.access.checkIfUserHasAccessToAccessPass({ userId: verified.userId, accessPassId: starterPassId });
        hasAccess = !!access.hasAccess;
      } catch {
        // If the Access Pass is misconfigured or not found, do not block compose; plan caps and credits still enforce usage
        hasAccess = true;
      }
    }
    if (!hasAccess && !trialEligible) {
      return NextResponse.json<ErrorBody>({ error: "FORBIDDEN_PAYWALL" }, { status: 403 });
    }

    // Enforce per-plan caps to match UI
    const caps: Record<Plan, { maxDuration: number; maxBatch: number }> = {
      STARTER: { maxDuration: 30, maxBatch: 2 },
      PRO: { maxDuration: 60, maxBatch: 4 },
      STUDIO: { maxDuration: 120, maxBatch: 10 },
    };
    const userCaps = caps[user.plan];
    if (parsed.duration > userCaps.maxDuration) {
      const requiredPlan = parsed.duration <= caps.PRO.maxDuration ? "PRO" : "STUDIO";
      return NextResponse.json({ error: "UPGRADE_REQUIRED", requiredPlan }, { status: 403 });
    }
    if (parsed.batch > userCaps.maxBatch) {
      const requiredPlan = parsed.batch <= caps.PRO.maxBatch ? "PRO" : "STUDIO";
      return NextResponse.json({ error: "UPGRADE_REQUIRED", requiredPlan }, { status: 403 });
    }

    // Credits cost: charge per 30s block per variation, unless trialEligible without access
    const creditUnits = Math.max(1, Math.ceil(parsed.duration / 30)) * parsed.batch;
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

    // Direct compose against ElevenLabs and return assets immediately
    if (!env.ELEVENLABS_API_KEY) {
      return NextResponse.json<ErrorBody>({ error: "MISSING_ELEVENLABS_API_KEY" }, { status: 500 });
    }

    const storage = getStorage();
    const assetsOut: Array<{ id: string; title: string; bpm: number; key: string | null; duration: number; wavUrl: string; loopUrl: string; stemsZipUrl?: string | null; licenseUrl: string }> = [];

    // Create a Job row for traceability (COMPLETED immediately after saves)
    const job = await prisma.job.create({
      data: { userId: user.id, status: "PROCESSING", payloadJson: parsed },
    });

    for (let i = 0; i < parsed.batch; i++) {
      const baseKey = `users/${user.id}/jobs/${job.id}/take_${i + 1}`;
      // Optionally reuse a composition plan: create a guided plan from prompt & duration
      let compositionPlan: unknown | undefined;
      if (parsed.reusePlan) {
        const planRes = await fetch("https://api.elevenlabs.io/v1/music/composition-plan/create", {
          method: "POST",
          headers: { "Content-Type": "application/json", "xi-api-key": env.ELEVENLABS_API_KEY, Accept: "application/json" },
          body: JSON.stringify({ prompt: parsed.vibe + (parsed.vocals ? ", with vocals" : ""), music_length_ms: parsed.duration * 1000 }),
        });
        if (planRes.ok) compositionPlan = await planRes.json().catch(() => undefined);
      }

      // Persist composition plan alongside the asset key for later reuse/edit
      if (compositionPlan) {
        await storage.putObject({ key: `${baseKey}_plan.json`, contentType: "application/json", body: Buffer.from(JSON.stringify(compositionPlan)) });
      }

      const bodyPayload = compositionPlan
        ? { composition_plan: compositionPlan }
        : { prompt: parsed.vibe + (parsed.vocals ? ", with vocals" : ""), music_length_ms: parsed.duration * 1000 };

      const composeRes = await fetch("https://api.elevenlabs.io/v1/music/compose", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": env.ELEVENLABS_API_KEY,
          Accept: "audio/mpeg",
        },
        body: JSON.stringify(bodyPayload),
      });
      if (!composeRes.ok) {
        const errText = await composeRes.text().catch(() => "");
        throw new Error(`ELEVENLABS_${composeRes.status}${errText ? ":" + errText : ""}`);
      }
      const arrayBuf = await composeRes.arrayBuffer();
      const audioBuf = Buffer.from(arrayBuf);

      const norm = await normalizeLoudness(audioBuf);
      const looped = await renderLoopVersion(norm);

      // Store MP3 outputs to match Eleven Music default; loop version as mp3 too
      await storage.putObject({ key: `${baseKey}.mp3`, contentType: "audio/mpeg", body: norm });
      await storage.putObject({ key: `${baseKey}_loop.mp3`, contentType: "audio/mpeg", body: looped });

      // Generate signed URLs for immediate playback and download
      const wavSigned = await storage.getSignedUrl({ key: `${baseKey}.mp3`, method: "GET" });
      const loopSigned = await storage.getSignedUrl({ key: `${baseKey}_loop.mp3`, method: "GET" });

      const asset = await prisma.asset.create({
        data: {
          userId: user.id,
          jobId: job.id,
          title: parsed.vibe,
          bpm: parsed.bpm,
          key: null,
          duration: parsed.duration,
          wavUrl: `${baseKey}.mp3`,
          loopUrl: `${baseKey}_loop.mp3`,
          stemsZipUrl: null,
          licenseUrl: `${baseKey}_license.txt`,
        },
      });
      assetsOut.push({ id: asset.id, title: asset.title, bpm: asset.bpm, key: asset.key, duration: asset.duration, wavUrl: wavSigned.url, loopUrl: loopSigned.url, stemsZipUrl: asset.stemsZipUrl, licenseUrl: asset.licenseUrl });
    }

    await prisma.job.update({ where: { id: job.id }, data: { status: "COMPLETED", completedAt: new Date() } });

    const res = NextResponse.json({ assets: assetsOut, trialUsed: !hasAccess && trialEligible });
    try {
      // Persist user id for future asset listing/downloads when Whop headers are absent
      res.cookies.set("musician_uid", user.id, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax", secure: true });
    } catch {}
    // Mark free trial consumed if applicable
    if (!hasAccess && trialEligible) {
      try {
        await prisma.event.create({ data: { userId: user.id, type: "FREE_TRIAL_USED", payloadJson: { at: new Date().toISOString() } } });
      } catch {}
    }
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN_ERROR";
    return NextResponse.json<ErrorBody>({ error: message }, { status: 400 });
  }
}

