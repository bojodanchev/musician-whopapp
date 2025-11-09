import { NextRequest } from "next/server";
import { verifyWhopFromRequest, getOrCreateAndSyncUser } from "@/lib/auth";
import { fetchEntitledPlan } from "@/lib/entitlements";
import { PLAN_BASELINE_CREDITS, PLAN_FEATURES, PlanName } from "@/lib/plans";
import { getPrisma } from "@/lib/prisma";
import { Plan } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const { prompt, duration } = (await req.json()) as { prompt: string; duration: number };
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) return new Response("Missing key", { status: 500 });

    const prisma = getPrisma();
    const verified = await verifyWhopFromRequest(req);
    const prismaUser = await getOrCreateAndSyncUser(verified.userId, undefined);
    let resolvedPlan: Plan = prismaUser.plan ?? Plan.STARTER;
    try {
      const detectedPlan = await fetchEntitledPlan(verified.userId);
      if (detectedPlan && detectedPlan !== prismaUser.plan) {
        const baseline = PLAN_BASELINE_CREDITS[detectedPlan as PlanName];
        const newCredits = Math.max(prismaUser.credits, baseline);
        await prisma.user.update({ where: { id: prismaUser.id }, data: { plan: detectedPlan, credits: newCredits } });
        prismaUser.plan = detectedPlan;
        prismaUser.credits = newCredits;
      }
      if (detectedPlan) {
        resolvedPlan = detectedPlan;
      }
    } catch (err) {
      console.error("Failed to sync entitlements for preview", err);
    }

    const planKey = (resolvedPlan ?? Plan.STARTER) as PlanName;
    if (!PLAN_FEATURES[planKey].allowStreaming) {
      return new Response(JSON.stringify({ error: "UPGRADE_REQUIRED", requiredPlan: "PRO" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const resp = await fetch("https://api.elevenlabs.io/v1/music/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json", "xi-api-key": apiKey },
      body: JSON.stringify({ prompt, music_length_ms: Math.max(10000, Math.min(120000, (duration || 30) * 1000)) }),
    });
    return new Response(resp.body, { headers: { "Content-Type": resp.headers.get("Content-Type") || "audio/mpeg" } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "STREAM_ERROR";
    return new Response(message, { status: 400 });
  }
}
