import { PrismaClient } from "@prisma/client";
import { assertDatabaseUrl } from "@/lib/env";

declare global {
  var prismaGlobal: PrismaClient | undefined;
}

// Ensure DATABASE_URL presence only when Prisma is actually instantiated
assertDatabaseUrl();
export const prisma: PrismaClient = global.prismaGlobal ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.prismaGlobal = prisma;
}

