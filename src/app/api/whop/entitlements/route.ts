import { NextRequest, NextResponse } from "next/server";
import { getWhopClient } from "@/lib/whop";

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "MISSING_USER" }, { status: 400 });
    const whop = getWhopClient();
    const ent = await whop.entitlements.list({ user_id: userId, limit: 50 } as any);
    return NextResponse.json({ entitlements: (ent as any).data ?? [] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "WHOP_ERROR" }, { status: 500 });
  }
}

