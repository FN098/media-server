import type { PrismaClient } from "@/generated/prisma/client";

declare global {
  // globalThis にプロパティを追加
  var prisma: PrismaClient | undefined;
  var isPrismaShutdownRegistered: boolean | undefined;
}

export {};
