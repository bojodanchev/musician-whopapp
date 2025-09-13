import { NextRequest, NextResponse } from "next/server";
import { whopSdk, plans, passes } from "@/lib/whop";

export async function GET(req: NextRequest) {
  const plan = req.nextUrl.searchParams.get("plan");
  if (!plan) return NextResponse.json({ error: "MISSING_PLAN" }, { status: 400 });

  const upper = plan.toUpperCase();
  const planId = (plans as Record<string, string | undefined>)[upper];
  const passId = (passes as Record<string, string | undefined>)[upper];
  if (!planId && !passId) return NextResponse.json({ error: "UNKNOWN_PLAN" }, { status: 400 });

  // Verify user token, but never 500 for missing/invalid headers
  let userId: string | undefined;
  try {
    const v = await whopSdk.verifyUserToken(req.headers);
    userId = v.userId;
  } catch {
    return NextResponse.json({ hasAccess: false });
  }
  if (!userId) return NextResponse.json({ hasAccess: false });

  // Check Experience (paid subscription) and Access Pass (feature gating)
  let expAccess = false;
  let passAccess = false;
  let accessLevel: string | undefined = undefined;
  try {
    if (planId) {
      const r = await whopSdk.access.checkIfUserHasAccessToExperience({ userId, experienceId: planId });
      expAccess = r.hasAccess;
      accessLevel = accessLevel ?? r.accessLevel;
    }
  } catch {}
  try {
    if (passId) {
      const r = await whopSdk.access.checkIfUserHasAccessToAccessPass({ userId, accessPassId: passId });
      passAccess = r.hasAccess;
    }
  } catch {}

  // For pricing, treat subscription access as Experience access only
  return NextResponse.json({ hasAccess: expAccess, experienceAccess: expAccess, passAccess, accessLevel });
}


