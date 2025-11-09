import { env } from "@/lib/env";
import { whopSdk, whopPublic } from "@/lib/whop";

type ShareArgs = {
  user: { username: string; whopUserId: string | null };
  prompt?: string;
  assets: Array<{ title: string; duration: number }>;
};

function buildShareLink() {
  const base = env.APP_PUBLIC_URL?.replace(/\/$/, "");
  if (base) return `${base}`;
  if (env.WHOP_FORUM_EXPERIENCE_ID) {
    return `https://whop.com/experiences/${env.WHOP_FORUM_EXPERIENCE_ID}/generate`;
  }
  if (whopPublic.appId) {
    return `https://whop.com/apps/${whopPublic.appId}/generate`;
  }
  return "https://whop.com/apps";
}

export async function broadcastGenerationToCommunity({ user, prompt, assets }: ShareArgs) {
  const forumExperienceId = env.WHOP_FORUM_EXPERIENCE_ID;
  const forumAccessPassId = env.WHOP_FORUM_ACCESS_PASS_ID;
  if (!forumExperienceId && !forumAccessPassId) return;

  const takesSummary = assets
    .slice(0, 3)
    .map((asset, idx) => `Take ${idx + 1}: ${asset.duration}s • ${asset.title}`)
    .join("\n");
  const content = [
    `New hooks from ${user.username || "a creator"}${prompt ? ` – ${prompt}` : ""}.`,
    takesSummary,
    "Open Musician to audition & download."
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    await whopSdk.forums.createForumPost({
      forumExperienceId: forumExperienceId ?? undefined,
      accessPassId: forumAccessPassId ?? undefined,
      title: prompt ? `New track: ${prompt}` : `New hooks from ${user.username || "creator"}`,
      content,
      isMention: true,
    });
  } catch (err) {
    console.error("Failed to post forum update", err);
  }

  const notificationExperienceId = env.WHOP_NOTIFICATION_EXPERIENCE_ID ?? forumExperienceId ?? undefined;
  const shareLink = buildShareLink();
  if (!notificationExperienceId && !user.whopUserId) return;
  try {
    await whopSdk.notifications.sendPushNotification({
      experienceId: notificationExperienceId,
      companyTeamId: env.WHOP_NOTIFICATION_TEAM_ID,
      title: prompt ? `Musician drop: ${prompt}` : "New hooks ready",
      content: assets.length === 1
        ? `Fresh ${assets[0].duration}s take is ready to preview.`
        : `${assets.length} new takes are ready to preview.`,
      link: shareLink,
      senderUserId: whopPublic.agentUserId,
      userIds: user.whopUserId ? [user.whopUserId] : undefined,
    });
  } catch (err) {
    console.error("Failed to send notification", err);
  }
}
