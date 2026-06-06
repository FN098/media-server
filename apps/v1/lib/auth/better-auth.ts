import { db } from "@/lib/prisma";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";

// @see https://better-auth.com/docs/installation

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "mysql",
  }),
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // 初回登録ユーザーに admin 権限付与
          await db.$transaction(async (tx) => {
            const adminCount = await tx.user.count({
              where: { role: "admin" },
            });

            if (adminCount === 0) {
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
  plugins: [admin()],
});
