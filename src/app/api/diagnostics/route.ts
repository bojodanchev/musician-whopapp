import { NextRequest, NextResponse } from "next/server";
import { verifyWhopFromRequest } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const verified = await verifyWhopFromRequest(req);
    const prisma = getPrisma();
    const user = await prisma.user.findFirst({ where: { whopUserId: verified.userId } });
    return NextResponse.json({ userId: verified.userId, accessLevel: verified.accessLevel, credits: user?.credits ?? null });
  } catch {
    return NextResponse.json({});
  }
}


