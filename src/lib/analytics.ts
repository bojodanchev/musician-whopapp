import { getPrisma } from "@/lib/prisma";

export type AnalyticsEvent =
  | "generate_requested"
  | "generate_completed"
  | "download_wav"
  | "download_stems"
  | "license_opened"
  | "upgrade_click";

const KNOWN_EVENTS = new Set<AnalyticsEvent>([
  "generate_requested",
  "generate_completed",
  "download_wav",
  "download_stems",
  "license_opened",
  "upgrade_click",
]);

export async function recordAnalyticsEvent(userId: string | null, type: AnalyticsEvent, payload: Record<string, unknown> = {}) {
  if (!userId) return;
  if (!KNOWN_EVENTS.has(type)) return;
  const prisma = getPrisma();
  try {
    await prisma.event.create({ data: { userId, type, payloadJson: payload } });
  } catch (err) {
    console.error("Failed to record analytics event", type, err);
  }
}
