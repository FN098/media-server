import { auth } from "@/lib/auth/better-auth";
import { AuthUserSchema } from "@/lib/auth/schemas";
import { AuthUser } from "@/lib/auth/types";
import { AppError } from "@/lib/errors/app-error";
import { headers } from "next/headers";

export async function resolveCurrentUser(): Promise<AuthUser | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session == null) return null;

  return AuthUserSchema.safeParse(session.user).data ?? null;
}

export async function resolveCurrentUserOrThrow(): Promise<AuthUser> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session == null) throw new AppError("UNAUTHORIZED", "Unauthorized");

  return AuthUserSchema.parse(session.user);
}
