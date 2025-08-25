import { whopSdk } from "@/lib/whop";
import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";

export type VerifiedWhop = {
  userId: string;
  experienceId?: string;
  accessLevel?: string;
};

export async function verifyWhopFromRequest(req: NextRequest): Promise<VerifiedWhop> {
  const { userId, experienceId, accessLevel } = await whopSdk.verifyUserToken(req.headers);
  return { userId, experienceId, accessLevel };
}

export async function getOrCreateUserByWhopId(whopUserId: string) {
  const user = await prisma.user.upsert({
    where: { whopUserId },
    create: {
      whopUserId,
      username: whopUserId.slice(0, 8),
      plan: "STARTER",
      credits: 10,
    },
    update: {},
  });
  return user;
}


