import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getPrisma } from "@/lib/prisma";
import { decrementCreditsAtomically } from "@/lib/credits";
import { verifyWhopFromRequest, getOrCreateAndSyncUser } from "@/lib/auth";
import { getStorage } from "@/lib/storage/s3";
import { normalizeLoudness, renderLoopVersion } from "@/lib/processing/audio";
import { env } from "@/lib/env";
import { whopSdk } from "@/lib/whop";

const composeSchema = z.object({
  vibe: z.string().min(1),
  bpm: z.number().int().min(40).max(220),
  duration: z.number().int().min(5).max(120),
  structure: z.string().min(1),
  seed: z.string().optional(),
  batch: z.number().int().min(1).max(10).default(1),
  stems: z.boolean().default(false),
});

type ErrorBody = { error: string };

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as unknown;
    const parsed = composeSchema.parse(body);

    const prisma = getPrisma();
    const verified = await verifyWhopFromRequest(req);
    const user = await getOrCreateAndSyncUser(verified.userId, undefined);

    // Enforce Whop access: user must have at least STARTER experience
    const experienceId = process.env.WHOP_PLAN_STARTER_ID as string | undefined;
    if (experienceId) {
      const access = await whopSdk.access.checkIfUserHasAccessToExperience({ userId: verified.userId, experienceId });
      if (!access.hasAccess) {
        return NextResponse.json<ErrorBody>({ error: "FORBIDDEN_PAYWALL" }, { status: 403 });
      }
    }

    // credits: 1 per variation
    try {
      await decrementCreditsAtomically(user.id, parsed.batch);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (message === "INSUFFICIENT_CREDITS") {
        return NextResponse.json<ErrorBody>({ error: "INSUFFICIENT_CREDITS" }, { status: 402 });
      }
      throw e;
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
      const composeRes = await fetch("https://api.elevenlabs.io/v1/music/compose", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": env.ELEVENLABS_API_KEY,
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({ prompt: parsed.vibe, music_length_ms: parsed.duration * 1000 }),
      });
      if (!composeRes.ok) {
        const errText = await composeRes.text().catch(() => "");
        throw new Error(`ELEVENLABS_${composeRes.status}${errText ? ":" + errText : ""}`);
      }
      const arrayBuf = await composeRes.arrayBuffer();
      const audioBuf = Buffer.from(arrayBuf);

      const norm = await normalizeLoudness(audioBuf);
      const looped = await renderLoopVersion(norm);

      const baseKey = `users/${user.id}/jobs/${job.id}/take_${i + 1}`;
      await storage.putObject({ key: `${baseKey}.wav`, contentType: "audio/wav", body: norm });
      await storage.putObject({ key: `${baseKey}_loop.wav`, contentType: "audio/wav", body: looped });

      const asset = await prisma.asset.create({
        data: {
          userId: user.id,
          jobId: job.id,
          title: parsed.vibe,
          bpm: parsed.bpm,
          key: null,
          duration: parsed.duration,
          wavUrl: `${baseKey}.wav`,
          loopUrl: `${baseKey}_loop.wav`,
          stemsZipUrl: null,
          licenseUrl: `${baseKey}_license.txt`,
        },
      });
      assetsOut.push({ id: asset.id, title: asset.title, bpm: asset.bpm, key: asset.key, duration: asset.duration, wavUrl: asset.wavUrl, loopUrl: asset.loopUrl, stemsZipUrl: asset.stemsZipUrl, licenseUrl: asset.licenseUrl });
    }

    await prisma.job.update({ where: { id: job.id }, data: { status: "COMPLETED", completedAt: new Date() } });

    return NextResponse.json({ assets: assetsOut });
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN_ERROR";
    return NextResponse.json<ErrorBody>({ error: message }, { status: 400 });
  }
}

