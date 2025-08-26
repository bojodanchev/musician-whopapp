import { NextRequest, NextResponse } from "next/server";
import { whopSdk, plans } from "@/lib/whop";

export async function GET(req: NextRequest) {
  try {
    const plan = req.nextUrl.searchParams.get("plan");
    if (!plan) return NextResponse.json({ error: "MISSING_PLAN" }, { status: 400 });
    const planId = (plans as Record<string, string | undefined>)[plan.toUpperCase()];
    if (!planId) return NextResponse.json({ error: "UNKNOWN_PLAN" }, { status: 400 });

    const { userId } = await whopSdk.verifyUserToken(req.headers);
    if (!userId) return NextResponse.json({ hasAccess: false });

    const result = await whopSdk.access.checkIfUserHasAccessToExperience({ userId, experienceId: planId });
    return NextResponse.json({ hasAccess: result.hasAccess, accessLevel: result.accessLevel });
  } catch (e) {
    return NextResponse.json({ error: "PAYWALL_ERROR" }, { status: 500 });
  }
}


