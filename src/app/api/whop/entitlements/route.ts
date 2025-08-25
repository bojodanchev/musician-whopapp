import { NextRequest, NextResponse } from "next/server";
import { getWhopClient } from "@/lib/whop";

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "MISSING_USER" }, { status: 400 });
    const whop = getWhopClient();
    const ent = await whop.entitlements.list({ user_id: userId, limit: 50 });
    return NextResponse.json({ entitlements: ent.data ?? [] });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "WHOP_ERROR";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

