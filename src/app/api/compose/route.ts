import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getMusicClient } from "@/lib/music/elevenlabs";
import { prisma } from "@/lib/prisma";
import { decrementCreditsAtomically } from "@/lib/credits";

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

    // TODO: replace with real auth session lookup
    const user = await prisma.user.findFirst();
    if (!user) return NextResponse.json<ErrorBody>({ error: "UNAUTHENTICATED" }, { status: 401 });

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

    const music = getMusicClient();
    const { jobId } = await music.createGenerateJob({
      prompt: parsed.vibe,
      bpm: parsed.bpm,
      duration: parsed.duration,
      structure: parsed.structure,
      seed: parsed.seed,
      stems: parsed.stems,
      variations: parsed.batch,
    });

    const job = await prisma.job.create({
      data: {
        id: jobId,
        userId: user.id,
        status: "QUEUED",
        payloadJson: parsed,
      },
    });

    return NextResponse.json({ jobId: job.id } as { jobId: string });
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNKNOWN_ERROR";
    return NextResponse.json<ErrorBody>({ error: message }, { status: 400 });
  }
}

