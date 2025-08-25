import { NextRequest, NextResponse } from "next/server";
import { verifyWhopFromRequest } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { env, isMockMusic } from "@/lib/env";
import { getStorage } from "@/lib/storage/s3";

export async function GET(req: NextRequest) {
  const prisma = getPrisma();

  // Whop/auth + credits
  let userId: string | undefined;
  let accessLevel: string | undefined;
  let credits: number | null = null;
  try {
    const verified = await verifyWhopFromRequest(req);
    userId = verified.userId;
    accessLevel = verified.accessLevel;
    if (userId) {
      const dbUser = await prisma.user.findFirst({ where: { whopUserId: userId } });
      credits = dbUser?.credits ?? null;
    }
  } catch {}

  // S3 readiness
  const s3EnvSet = Boolean(env.S3_BUCKET && env.S3_REGION);
  let s3Ready = false;
  try {
    const storage = getStorage();
    await storage.getSignedUrl({ key: `diagnostics/probe-${Date.now()}.txt`, method: "PUT", contentType: "text/plain", expiresInSeconds: 60 });
    s3Ready = true;
  } catch {
    s3Ready = false;
  }

  return NextResponse.json({
    userId,
    accessLevel,
    credits,
    env: {
      USE_MOCK_MUSIC: isMockMusic,
      S3_BUCKET: Boolean(env.S3_BUCKET),
      S3_REGION: Boolean(env.S3_REGION),
      S3_READY: s3EnvSet && s3Ready,
    },
  });
}


