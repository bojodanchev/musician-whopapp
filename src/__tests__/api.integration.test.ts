import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { NextResponse, NextRequest } from "next/server";
import { Plan } from "@prisma/client";

const { analyticsSpy } = vi.hoisted(() => ({ analyticsSpy: vi.fn() }));

vi.mock("@/lib/analytics", () => ({
  recordAnalyticsEvent: (...args: any[]) => analyticsSpy(...args),
}));

const mockDb = {
  users: [{ id: "user_db", whopUserId: "whop_user", plan: Plan.PRO, credits: 600 }],
  assets: [
    {
      id: "asset_1",
      userId: "user_db",
      title: "Demo",
      bpm: 120,
      key: "-",
      duration: 30,
      wavUrl: "users/user_db/jobs/job_1/take_1.mp3",
      loopUrl: "users/user_db/jobs/job_1/take_1_loop.mp3",
      stemsZipUrl: "users/user_db/jobs/job_1/take_1_stems.zip",
      licenseUrl: "users/user_db/jobs/job_1/license.txt",
      createdAt: new Date(),
    },
  ],
  events: [] as Array<{ userId: string; type: string }>,
};

const prismaMock = {
  event: {
    findFirst: vi.fn(async () => null),
    create: vi.fn(async ({ data }: { data: any }) => {
      mockDb.events.push(data);
      return data;
    }),
  },
  user: {
    update: vi.fn(async ({ where, data }: { where: { id: string }; data: any }) => {
      const user = mockDb.users.find((u) => u.id === where.id);
      if (!user) throw new Error("USER_NOT_FOUND");
      Object.assign(user, data);
      return user;
    }),
    findFirst: vi.fn(async ({ where }: { where: { whopUserId: string } }) => mockDb.users.find((u) => u.whopUserId === where.whopUserId) ?? null),
    findUnique: vi.fn(async ({ where }: { where: { id: string } }) => mockDb.users.find((u) => u.id === where.id) ?? null),
    upsert: vi.fn(async ({ where }: { where: { whopUserId: string } }) => mockDb.users.find((u) => u.whopUserId === where.whopUserId) ?? mockDb.users[0]),
  },
  job: {
    upsert: vi.fn(async ({ create }: { create: any }) => ({ id: create.id, userId: create.userId })),
    findUnique: vi.fn(async () => ({ id: "job_123", userId: "user_db", status: "PROCESSING", payloadJson: {}, assets: [] })),
  },
  asset: {
    findMany: vi.fn(async ({ where }: { where: { userId: string } }) => mockDb.assets.filter((a) => a.userId === where.userId)),
    findFirst: vi.fn(async ({ where, include }: { where: { id: string; userId: string }; include?: { user: boolean } }) => {
      const asset = mockDb.assets.find((a) => a.id === where.id && a.userId === where.userId);
      if (!asset) return null;
      return include?.user ? { ...asset, user: mockDb.users[0] } : asset;
    }),
  },
};

vi.mock("@/lib/prisma", () => ({
  getPrisma: () => prismaMock,
}));

vi.mock("@/lib/credits", () => ({
  decrementCreditsAtomically: vi.fn(async () => 500),
}));

vi.mock("@/lib/auth", () => ({
  verifyWhopFromRequest: vi.fn(async () => ({ userId: "user_db" })),
  getOrCreateAndSyncUser: vi.fn(async () => ({ id: "user_db", plan: Plan.PRO, credits: 600 })),
}));

vi.mock("@/lib/entitlements", () => ({
  fetchEntitledPlan: vi.fn(async () => Plan.PRO),
}));

vi.mock("@/lib/music/elevenlabs", () => ({
  getMusicClient: () => ({
    createGenerateJob: vi.fn(async () => ({ jobId: "job_123" })),
  }),
}));

vi.mock("@/lib/storage/s3", () => ({
  getStorage: () => ({
    getSignedUrl: vi.fn(async ({ key }: { key: string }) => ({ url: `https://signed/${key}` })),
    putObject: vi.fn(async () => ({})),
  }),
}));

vi.mock("next/headers", () => {
  const headers = () => new Headers();
  const cookieJar = { get: () => ({ value: "user_db" }) };
  return {
    headers: () => headers(),
    cookies: () => cookieJar,
  };
});

vi.mock("next/server", async () => {
  const actual = await vi.importActual<typeof import("next/server")>("next/server");
  return actual;
});

global.fetch = vi.fn(async () => new Response("file", { headers: { "Content-Type": "text/plain" } })) as any;

import { POST as composePost } from "../app/api/compose/route";
import { GET as assetsGet } from "../app/api/assets/route";
import { POST as licensePost } from "../app/api/licenses/[assetId]/route";

beforeEach(() => {
  analyticsSpy.mockClear();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("API integration", () => {
  it("creates compose job and logs analytics", async () => {
    const req = {
      json: async () => ({
        vibe: "Test vibe",
        bpm: 120,
        duration: 30,
        structure: "intro-drop-outro",
        batch: 1,
        stems: false,
        vocals: false,
        reusePlan: false,
        streamingPreview: false,
        shareToForum: false,
      }),
      headers: new Headers(),
    } as unknown as Request;

    const response = (await composePost(req as any)) as NextResponse;
    const data = await response.json();
    expect(data).toMatchObject({ jobId: "job_123" });
    expect(analyticsSpy).toHaveBeenCalledWith("user_db", "generate_requested", expect.any(Object));
  });

  it("returns asset list via /api/assets", async () => {
    const req = { headers: new Headers() } as unknown as Request;
    const response = (await assetsGet(req as any)) as NextResponse;
    const data = await response.json();
    expect(Array.isArray(data.assets)).toBe(true);
    expect(data.assets[0].wavUrl).toContain("https://signed/");
  });

  it("serves license downloads and logs analytics", async () => {
    const req = { headers: new Headers() } as NextRequest;
    const ctx = { params: Promise.resolve({ assetId: "asset_1" }) };
    const response = await licensePost(req as any, ctx);
    const text = await response.text();
    expect(response.status).toBe(200);
    expect(text).toContain("file");
    expect(analyticsSpy).toHaveBeenCalledWith("user_db", "license_opened", { assetId: "asset_1" });
  });
});
