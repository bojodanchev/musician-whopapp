import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "@/lib/prisma";
import { decrementCreditsAtomically } from "@/lib/credits";

describe("credits", () => {
  beforeAll(async () => {
    // Ensure a user exists
    const existing = await prisma.user.findFirst();
    if (!existing) {
      await prisma.user.create({ data: { whopUserId: "dev", username: "dev", plan: "STARTER", credits: 10 } });
    }
  });

  it("decrements credits atomically and blocks below zero", async () => {
    const user = await prisma.user.findFirstOrThrow();
    const before = user.credits;
    await decrementCreditsAtomically(user.id, 2);
    const after = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(after.credits).toBe(before - 2);

    await expect(decrementCreditsAtomically(user.id, 100000)).rejects.toThrow();
  });
});
