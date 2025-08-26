import { NextRequest, NextResponse } from "next/server";
import { subscribeUrl, plans } from "@/lib/whop";

export async function GET(req: NextRequest) {
  const plan = req.nextUrl.searchParams.get("plan");
  if (!plan) return NextResponse.json({ error: "MISSING_PLAN" }, { status: 400 });
  const planId = (plans as Record<string, string | undefined>)[plan.toUpperCase()];
  if (!planId) return NextResponse.json({ error: "UNKNOWN_PLAN" }, { status: 400 });
  const url = subscribeUrl(planId);
  return NextResponse.redirect(url);
}


