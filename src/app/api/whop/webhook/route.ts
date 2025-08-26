import { NextRequest, NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";
import { passes, whopSdk } from "@/lib/whop";
import { Plan } from "@prisma/client";

// Basic webhook to sync credits/plan when Whop notifies purchase or renewal.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Minimal validation; ideally verify signature if provided by Whop
    const userId: string | undefined = body?.userId || body?.user?.id;
    const accessPassId: string | undefined = body?.accessPassId || body?.experienceId;
    if (!userId || !accessPassId) return NextResponse.json({ ok: false });

    const prisma = getPrisma();
    // Map access pass to plan
    let plan: Plan | null = null;
    if (accessPassId === passes.STARTER) plan = Plan.STARTER;
    if (accessPassId === passes.PRO) plan = Plan.PRO;
    if (accessPassId === passes.STUDIO) plan = Plan.STUDIO;
    if (!plan) return NextResponse.json({ ok: true });

    const STARTER = 150; const PRO = 600; const STUDIO = 2000;
    const creditsByPlan: Record<Plan, number> = { STARTER, PRO, STUDIO } as const;

    // Upsert user by whopUserId and top-up credits to at least their plan baseline on renewal/purchase
    const user = await prisma.user.upsert({
      where: { whopUserId: userId },
      update: {},
      create: { whopUserId: userId, username: userId.slice(0,8), plan: plan, credits: creditsByPlan[plan] },
    });

    const newPlan = plan;
    const minCredits = creditsByPlan[newPlan];
    await prisma.user.update({
      where: { id: user.id },
      data: {
        plan: newPlan,
        credits: user.credits < minCredits ? minCredits : user.credits,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false });
  }
}


