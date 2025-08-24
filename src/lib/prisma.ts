import { PrismaClient } from "@prisma/client";

declare global {
  var prismaGlobal: PrismaClient | undefined;
}

export function getPrisma(): PrismaClient {
  if (!global.prismaGlobal) {
    global.prismaGlobal = new PrismaClient();
  }
  return global.prismaGlobal;
}

