import { WhopAPI } from "@whop/api";

export function getWhopClient() {
  const apiKey = process.env.WHOP_API_KEY;
  if (!apiKey) throw new Error("Missing WHOP_API_KEY");
  return new WhopAPI({ token: apiKey });
}

export const whopPublic = {
  appId: process.env.NEXT_PUBLIC_WHOP_APP_ID,
  agentUserId: process.env.NEXT_PUBLIC_WHOP_AGENT_USER_ID,
  companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID,
};

