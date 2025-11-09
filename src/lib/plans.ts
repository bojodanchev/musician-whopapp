export type PlanName = "STARTER" | "PRO" | "STUDIO";

export const PLAN_BASELINE_CREDITS: Record<PlanName, number> = {
  STARTER: 150,
  PRO: 600,
  STUDIO: 2000,
} as const;

export const PLAN_CAPS: Record<PlanName, { maxDuration: number; maxBatch: number; allowStreaming: boolean; allowAdvanced: boolean; allowVocals: boolean; allowStems: boolean }> = {
  STARTER: { maxDuration: 30, maxBatch: 2, allowStreaming: false, allowAdvanced: false, allowVocals: false, allowStems: false },
  PRO: { maxDuration: 60, maxBatch: 10, allowStreaming: true, allowAdvanced: true, allowVocals: true, allowStems: true },
  STUDIO: { maxDuration: 120, maxBatch: 10, allowStreaming: true, allowAdvanced: true, allowVocals: true, allowStems: true },
} as const;

export const PLAN_FEATURES: Record<PlanName, { allowStems: boolean; allowVocals: boolean; allowReusePlan: boolean; allowStreaming: boolean }> = {
  STARTER: { allowStems: false, allowVocals: false, allowReusePlan: false, allowStreaming: false },
  PRO: { allowStems: true, allowVocals: true, allowReusePlan: true, allowStreaming: true },
  STUDIO: { allowStems: true, allowVocals: true, allowReusePlan: true, allowStreaming: true },
} as const;
