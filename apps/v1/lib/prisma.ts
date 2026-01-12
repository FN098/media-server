/**
 * @see https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/no-rust-engine
 * @see https://www.prisma.io/docs/getting-started/prisma-orm/quickstart/mysql
 * @see https://github.com/prisma/prisma/issues/28612
 */

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import "dotenv/config";

const adapter = new PrismaMariaDb({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  connectionLimit: 5,
  allowPublicKeyRetrieval: true,

  // デバッグ用
  // logger: {
  //   network: (info) => {
  //     console.log("PrismaAdapterNetwork", info);
  //   },
  //   query: (info) => {
  //     console.log("PrismaAdapterQuery", info);
  //   },
  //   error: (error) => {
  //     console.error("PrismaAdapterError", error);
  //   },
  //   warning: (info) => {
  //     console.warn("PrismaAdapterWarning", info);
  //   },
  // },
});

const prisma =
  globalThis.prisma ??
  new PrismaClient({
    adapter,
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

export { prisma };
