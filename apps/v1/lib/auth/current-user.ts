import { auth } from "@/lib/auth/better-auth";
import { AuthUser } from "@/lib/auth/types";
import { AppError } from "@/lib/errors/app-error";
import { headers } from "next/headers";

export async function resolveCurrentUser(): Promise<AuthUser | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session?.user ?? null;
}

export async function resolveCurrentUserOrThrow(): Promise<AuthUser> {
  const user = await resolveCurrentUser();
  if (!user) throw new AppError("UNAUTHORIZED", "Unauthorized");
  return user;
}
