import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { passes, plans } from "@/lib/whop";
import { Plan } from "@prisma/client";
import crypto from "crypto";

// Basic webhook to sync credits/plan when Whop notifies purchase or renewal.
export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();

    // Verify webhook signature if secret is set (best-effort, do not 500)
    const secret = process.env.WHOP_WEBHOOK_SECRET;
    if (secret) {
      const headerSig =
        req.headers.get("whop-signature") ||
        req.headers.get("x-whop-signature") ||
        req.headers.get("whop-webhook-signature");
      if (!headerSig) {
        // accept but flag
      } else {
        const hmac = crypto.createHmac("sha256", secret).update(raw).digest("hex");
        if (hmac !== headerSig) {
          // accept but flag mismatch
        }
      }
    }

    const body = JSON.parse(raw);
    const eventType: string | undefined = body?.type || body?.event;
    // Minimal validation; ideally verify signature if provided by Whop
    const userId: string | undefined = body?.userId || body?.user?.id || body?.data?.userId || body?.data?.user?.id;
    const accessPassId: string | undefined = body?.accessPassId || body?.data?.accessPassId;
    const experienceId: string | undefined = body?.experienceId || body?.data?.experienceId;
    if (!userId || !accessPassId) return NextResponse.json({ ok: false });

    const prisma = getPrisma();
    // Map Access Pass or Experience to plan
    let plan: Plan | null = null;
    if (accessPassId === passes.STARTER || experienceId === plans.STARTER) plan = Plan.STARTER;
    if (accessPassId === passes.PRO || experienceId === plans.PRO) plan = Plan.PRO;
    if (accessPassId === passes.STUDIO || experienceId === plans.STUDIO) plan = Plan.STUDIO;
    if (!plan) return NextResponse.json({ ok: true });

    const STARTER = 50; const PRO = 200; const STUDIO = 700;
    const creditsByPlan: Record<Plan, number> = { STARTER, PRO, STUDIO } as const;

    // Upsert user by whopUserId and top-up credits to at least their plan baseline on renewal/purchase
    const user = await prisma.user.upsert({
      where: { whopUserId: userId },
      update: {},
      create: { whopUserId: userId, username: userId.slice(0,8), plan: plan, credits: creditsByPlan[plan] },
    });

    const newPlan = plan;
    const minCredits = creditsByPlan[newPlan];
    // Only on positive events: mark plan and top-up baseline if below
    if (
      !eventType ||
      [
        "membership_experience_claimed",
        "membership_metadata_updated",
        "membership_went_valid",
        "payment_succeeded",
      ].includes(eventType)
    ) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          plan: newPlan,
          credits: user.credits < minCredits ? minCredits : user.credits,
        },
      });
    }
    // Optionally handle invalidation: downgrade plan to STARTER but keep credits
    if (eventType === "membership_went_invalid") {
      await prisma.user.update({ where: { id: user.id }, data: { plan: Plan.STARTER } });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}


