import { prisma } from "@/lib/prisma";

export async function decrementCreditsAtomically(userId: string, amount: number) {
  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error("User not found");
    if (user.credits < amount) throw new Error("INSUFFICIENT_CREDITS");
    const updated = await tx.user.update({
      where: { id: userId },
      data: { credits: { decrement: amount } },
    });
    return updated.credits;
  }, { maxWait: 5000, timeout: 10000 });
}

