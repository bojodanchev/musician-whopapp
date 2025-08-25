import { NextRequest, NextResponse } from "next/server";
import { getWhopClient } from "@/lib/whop";

export async function GET(req: NextRequest) {
  try {
    const experienceId = req.nextUrl.searchParams.get("experienceId");
    if (!experienceId) return NextResponse.json({ error: "MISSING_EXPERIENCE" }, { status: 400 });
    const whop = getWhopClient();
    const { userId } = await whop.verifyUserToken(req.headers);
    const result = await whop.access.checkIfUserHasAccessToExperience({ userId, experienceId });
    return NextResponse.json({ hasAccess: result.hasAccess, accessLevel: result.accessLevel });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "WHOP_ERROR";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

