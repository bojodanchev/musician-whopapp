import { WhopServerSdk } from "@whop/api";

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

export async function userHasPlan(userId: string, planId: string) {
  const result = await whopSdk.access.checkIfUserHasAccessToExperience({ userId, experienceId: planId });
  return result.hasAccess;
}

export function subscribeUrl(planId: string) {
  // Direct subscribe URL for Whop Experience
  return `https://whop.com/checkout/${planId}?app_id=${APP_ID}`;
}

