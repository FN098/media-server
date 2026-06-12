import { db } from "@/lib/prisma";
import { parseCsvEnv } from "@/lib/utils/env";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";

// @see https://better-auth.com/docs/installation

const allowedOrigins = parseCsvEnv(process.env.ALLOWED_ORIGINS);

export const auth = betterAuth({
  trustedOrigins: allowedOrigins,
  database: prismaAdapter(db, {
    provider: "mysql",
  }),
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // 初回登録ユーザーに admin 権限付与
          await db.$transaction(async (tx) => {
            const admin = await tx.user.findFirst({
              where: { role: "admin" },
              select: { id: true },
            });

            if (admin === null) {
              await db.user.update({
                where: { id: user.id },
                data: { role: "admin" },
              });
            }
          });
        },
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  plugins: [
    // 管理者ユーザー用のAPI拡張プラグイン
    admin(),

    // サーバーアクションでレスポンスに Set-Cookie を自動で付与するプラグイン
    // https://better-auth.com/docs/integrations/next#server-action-cookies
    nextCookies(),
  ],
});
