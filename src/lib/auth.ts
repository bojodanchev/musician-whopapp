import { whopSdk } from "@/lib/whop";
import { prisma } from "@/lib/prisma";
import { Plan } from "@prisma/client";
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
      plan: Plan.STARTER,
      credits: 10,
    },
    update: {},
  });
  return user;
}

function mapPlanFromAccess(accessLevel?: string): { plan: Plan; startingCredits: number } {
  const level = (accessLevel ?? "").toLowerCase();
  if (level.includes("studio")) return { plan: Plan.STUDIO, startingCredits: 2000 };
  if (level.includes("pro")) return { plan: Plan.PRO, startingCredits: 600 };
  return { plan: Plan.STARTER, startingCredits: 150 };
}

export async function getOrCreateAndSyncUser(whopUserId: string, accessLevel?: string) {
  const mapped = mapPlanFromAccess(accessLevel);
  const existing = await prisma.user.findUnique({ where: { whopUserId } });
  if (!existing) {
    return prisma.user.create({
      data: {
        whopUserId,
        username: whopUserId.slice(0, 8),
        plan: mapped.plan,
        credits: mapped.startingCredits,
      },
    });
  }
  if (existing.plan !== mapped.plan) {
    const newCredits = Math.max(existing.credits, mapped.startingCredits);
    return prisma.user.update({ where: { id: existing.id }, data: { plan: mapped.plan, credits: newCredits } });
  }
  return existing;
}


