import { db } from "@/lib/prisma";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

// @see https://better-auth.com/docs/installation

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "mysql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
});
