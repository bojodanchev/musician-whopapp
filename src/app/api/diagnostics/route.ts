import { NextRequest, NextResponse } from "next/server";
import { verifyWhopFromRequest } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { env, isMockMusic } from "@/lib/env";
import { getStorage } from "@/lib/storage/s3";
import { whopSdk } from "@/lib/whop";

export async function GET(req: NextRequest) {
  const prisma = getPrisma();

  // Whop/auth + credits
  let userId: string | undefined;
  let accessLevel: string | undefined;
  let credits: number | null = null;
  let plan: string | undefined;
  try {
    const verified = await verifyWhopFromRequest(req);
    userId = verified.userId;
    if (userId) {
      const dbUser = await prisma.user.findFirst({ where: { whopUserId: userId } });
      credits = dbUser?.credits ?? null;
      plan = dbUser?.plan;
    }
  } catch {}

  // Try to compute access level if we have an experienceId
  try {
    const experienceId = req.nextUrl.searchParams.get("experienceId");
    if (userId && experienceId) {
      const result = await whopSdk.access.checkIfUserHasAccessToExperience({ userId, experienceId });
      accessLevel = result.accessLevel;
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
    plan,
    env: {
      USE_MOCK_MUSIC: isMockMusic,
      S3_BUCKET: Boolean(env.S3_BUCKET),
      S3_REGION: Boolean(env.S3_REGION),
      S3_READY: s3EnvSet && s3Ready,
    },
  });
}


