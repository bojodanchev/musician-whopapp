import { Plan } from "@prisma/client";
import { whopSdk, plans as whopPlans, passes as whopPasses } from "@/lib/whop";

const ENTITLEMENT_TTL_MS = 5 * 60 * 1000;
const entitlementCache = new Map<string, { plan: Plan; expiresAt: number }>();

export async function fetchEntitledPlan(userId: string): Promise<Plan | null> {
  const cached = entitlementCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.plan;
  }
  const expPriority: Array<{ id?: string; plan: Plan }> = [
    { id: whopPlans.STUDIO, plan: Plan.STUDIO },
    { id: whopPlans.PRO, plan: Plan.PRO },
    { id: whopPlans.STARTER, plan: Plan.STARTER },
  ];
  const passPriority: Array<{ id?: string; plan: Plan }> = [
    { id: whopPasses.STUDIO, plan: Plan.STUDIO },
    { id: whopPasses.PRO, plan: Plan.PRO },
    { id: whopPasses.STARTER, plan: Plan.STARTER },
  ];
  let detectedPlan: Plan | null = null;
  try {
    for (const { id, plan } of expPriority) {
      if (!id) continue;
      const res = await whopSdk.access.checkIfUserHasAccessToExperience({ userId, experienceId: id });
      if (res.hasAccess) {
        detectedPlan = plan;
        break;
      }
    }
    if (!detectedPlan) {
      for (const { id, plan } of passPriority) {
        if (!id) continue;
        const res = await whopSdk.access.checkIfUserHasAccessToAccessPass({ userId, accessPassId: id });
        if (res.hasAccess) {
          detectedPlan = plan;
          break;
        }
      }
    }
  } catch (err) {
    console.error("Failed to verify Whop entitlements", err);
  }
  if (detectedPlan) {
    entitlementCache.set(userId, { plan: detectedPlan, expiresAt: Date.now() + ENTITLEMENT_TTL_MS });
  }
  return detectedPlan;
}
