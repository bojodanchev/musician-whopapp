import { NextRequest, NextResponse } from "next/server";
import { whopSdk, plans, passes, PLAN_BASELINE_CREDITS } from "@/lib/whop";
import { getPrisma } from "@/lib/prisma";
import { Plan } from "@prisma/client";

function computePlan(flags: { starter: boolean; pro: boolean; studio: boolean }): Plan | null {
  if (flags.studio) return Plan.STUDIO;
  if (flags.pro) return Plan.PRO;
  if (flags.starter) return Plan.STARTER;
  return null;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const token = req.headers.get("x-dev-token") || url.searchParams.get("token");
  if (!process.env.DEV_ADMIN_TOKEN || token !== process.env.DEV_ADMIN_TOKEN) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const userId = url.searchParams.get("user");
  const sync = url.searchParams.get("sync");
  if (!userId) return NextResponse.json({ ok: false, error: "MISSING_USER" }, { status: 400 });

  // Check experiences and passes for the given user
  type PlanName = "STARTER" | "PRO" | "STUDIO";
  type Flags = Record<PlanName, boolean>;
  const emptyFlags: Flags = { STARTER: false, PRO: false, STUDIO: false };
  const res: { experiences: Flags; passes: Flags } = { experiences: { ...emptyFlags }, passes: { ...emptyFlags } };
  const names: Array<PlanName> = ["STARTER", "PRO", "STUDIO"];
  for (const name of names) {
    const expId = (plans as Record<string, string | undefined>)[name];
    const passId = (passes as Record<string, string | undefined>)[name];
    try {
      if (expId) {
        const r = await whopSdk.access.checkIfUserHasAccessToExperience({ userId, experienceId: expId });
        res.experiences[name] = r.hasAccess;
      }
    } catch {
      res.experiences[name] = false;
    }
    try {
      if (passId) {
        const r = await whopSdk.access.checkIfUserHasAccessToAccessPass({ userId, accessPassId: passId });
        res.passes[name] = r.hasAccess;
      }
    } catch {
      res.passes[name] = false;
    }
  }

  const detected = computePlan({
    starter: Boolean(res.experiences.STARTER || res.passes.STARTER),
    pro: Boolean(res.experiences.PRO || res.passes.PRO),
    studio: Boolean(res.experiences.STUDIO || res.passes.STUDIO),
  });

  let updated: { plan: Plan; credits: number } | undefined;
  if (sync && detected) {
    const prisma = getPrisma();
    const baseline = PLAN_BASELINE_CREDITS[detected];
    const existing = await prisma.user.findUnique({ where: { whopUserId: userId } });
    if (!existing) {
      const u = await prisma.user.create({ data: { whopUserId: userId, username: userId.slice(0, 8), plan: detected, credits: baseline } });
      updated = { plan: u.plan, credits: u.credits };
    } else {
      const nextCredits = existing.credits < baseline ? baseline : existing.credits;
      const u = await prisma.user.update({ where: { id: existing.id }, data: { plan: detected, credits: nextCredits } });
      updated = { plan: u.plan, credits: u.credits };
    }
  }

  return NextResponse.json({ ok: true, userId, entitlements: res, detectedPlan: detected, updated });
}


