import { WhopServerSdk } from "@whop/api";
import { PLAN_BASELINE_CREDITS } from "@/lib/plans";

const APP_ID = process.env.NEXT_PUBLIC_WHOP_APP_ID;
const APP_API_KEY = process.env.WHOP_API_KEY;
const AGENT_USER_ID = process.env.NEXT_PUBLIC_WHOP_AGENT_USER_ID;
const COMPANY_ID = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID;

if (!APP_ID || !APP_API_KEY) {
  throw new Error("Missing Whop envs: NEXT_PUBLIC_WHOP_APP_ID and WHOP_API_KEY are required");
}

export const whopSdk = WhopServerSdk({
  appId: APP_ID,
  appApiKey: APP_API_KEY,
  onBehalfOfUserId: AGENT_USER_ID,
  companyId: COMPANY_ID,
});

export function getWhopClient() {
  return whopSdk;
}

export const whopPublic = {
  appId: process.env.NEXT_PUBLIC_WHOP_APP_ID,
  agentUserId: process.env.NEXT_PUBLIC_WHOP_AGENT_USER_ID,
  companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID,
};

export const plans = {
  STARTER: process.env.WHOP_PLAN_STARTER_ID,
  PRO: process.env.WHOP_PLAN_PRO_ID,
  STUDIO: process.env.WHOP_PLAN_STUDIO_ID,
};

export const passes = {
  STARTER: process.env.WHOP_PASS_STARTER_ID,
  PRO: process.env.WHOP_PASS_PRO_ID,
  STUDIO: process.env.WHOP_PASS_STUDIO_ID,
};

export async function userHasPlan(userId: string, planId: string) {
  const result = await whopSdk.access.checkIfUserHasAccessToExperience({ userId, experienceId: planId });
  return result.hasAccess;
}

export function subscribeUrl(planId: string, affiliateCode?: string) {
  // Direct subscribe URL for Whop Experience with optional affiliate code
  const url = new URL(`https://whop.com/checkout/${planId}`);
  url.searchParams.set("app_id", APP_ID ?? "");
  if (affiliateCode) {
    url.searchParams.set("affiliate_code", affiliateCode);
  }
  return url.toString();
}

export async function userHasAccessPass(userId: string, passId: string) {
  const res = await whopSdk.access.checkIfUserHasAccessToAccessPass({ userId, accessPassId: passId });
  return res.hasAccess;
}

// Plan caps used in UI and server enforcement
export const WHOP_PLAN_CAPS = {
  STARTER: { maxDuration: 30, maxBatch: 2 },
  PRO: { maxDuration: 60, maxBatch: 4 },
  STUDIO: { maxDuration: 120, maxBatch: 10 },
} as const;

// Suggested monthly baseline credits aligned to Eleven costs (~650 credits per 30s gen)
export { PLAN_BASELINE_CREDITS };
