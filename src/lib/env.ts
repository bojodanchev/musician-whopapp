import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  // Make optional at build-time; assert at runtime when needed
  DATABASE_URL: z.string().url().optional(),
  ELEVENLABS_API_KEY: z.string().optional(),
  USE_MOCK_MUSIC: z.string().optional(),
  STORAGE_PROVIDER: z.enum(["s3", "supabase"]).default("s3").optional(),
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  WHOP_APP_ID: z.string().optional(),
  WHOP_APP_SECRET: z.string().optional(),
  JWT_SECRET: z.string().optional(),
  WHOP_FORUM_EXPERIENCE_ID: z.string().optional(),
  WHOP_FORUM_ACCESS_PASS_ID: z.string().optional(),
  WHOP_NOTIFICATION_EXPERIENCE_ID: z.string().optional(),
  WHOP_NOTIFICATION_TEAM_ID: z.string().optional(),
  APP_PUBLIC_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
  USE_MOCK_MUSIC: process.env.USE_MOCK_MUSIC,
  STORAGE_PROVIDER: process.env.STORAGE_PROVIDER,
  S3_BUCKET: process.env.S3_BUCKET,
  S3_REGION: process.env.S3_REGION,
  S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
  S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
  WHOP_APP_ID: process.env.WHOP_APP_ID,
  WHOP_APP_SECRET: process.env.WHOP_APP_SECRET,
  JWT_SECRET: process.env.JWT_SECRET,
  WHOP_FORUM_EXPERIENCE_ID: process.env.WHOP_FORUM_EXPERIENCE_ID,
  WHOP_FORUM_ACCESS_PASS_ID: process.env.WHOP_FORUM_ACCESS_PASS_ID,
  WHOP_NOTIFICATION_EXPERIENCE_ID: process.env.WHOP_NOTIFICATION_EXPERIENCE_ID,
  WHOP_NOTIFICATION_TEAM_ID: process.env.WHOP_NOTIFICATION_TEAM_ID,
  APP_PUBLIC_URL: process.env.APP_PUBLIC_URL,
});

export const isMockMusic = env.USE_MOCK_MUSIC === "1" || env.NODE_ENV !== "production";

export function assertDatabaseUrl(): string {
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required at runtime but was not set");
  }
  return env.DATABASE_URL;
}
