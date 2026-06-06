import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

// @see https://better-auth.com/docs/installation

export const authClient = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL,
  plugins: [adminClient()],
});
