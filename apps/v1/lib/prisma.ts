/**
 * @see https://www.prisma.io/docs/getting-started/prisma-orm/quickstart/mysql
 */

import { PrismaClient } from "@/generated/prisma/client";
import "dotenv/config";

export const prisma =
  globalThis.prisma ??
  new PrismaClient({
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}
