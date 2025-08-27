import { NextRequest, NextResponse } from "next/server";
import { verifyWhopFromRequest, getOrCreateAndSyncUser } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { PLAN_BASELINE_CREDITS } from "@/lib/whop";
import { Plan } from "@prisma/client";

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const planParam = (url.searchParams.get("plan") || "PRO").toUpperCase();
  const token = req.headers.get("x-dev-token") || url.searchParams.get("token");
  if (!process.env.DEV_ADMIN_TOKEN || token !== process.env.DEV_ADMIN_TOKEN) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }
  const { userId } = await verifyWhopFromRequest(req);
  if (!userId) return NextResponse.json({ ok: false, error: "NO_USER" }, { status: 401 });

  const prisma = getPrisma();
  const user = await getOrCreateAndSyncUser(userId);
  const targetPlan = planParam === "STUDIO" ? Plan.STUDIO : planParam === "PRO" ? Plan.PRO : Plan.STARTER;
  const minCredits = PLAN_BASELINE_CREDITS[targetPlan];
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { plan: targetPlan, credits: user.credits < minCredits ? minCredits : user.credits },
  });
  return NextResponse.json({ ok: true, plan: updated.plan, credits: updated.credits });
}


