import { auth } from "@/lib/auth/better-auth";
import { CurrentUser, currentUserSchema } from "@/lib/auth/current-user-schema";
import { buildSignInUrl } from "@/lib/auth/sign-in-url";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function resolveCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session == null) return null;

  return currentUserSchema.safeParse(session.user).data ?? null;
}

export async function resolveCurrentUserOrThrow(): Promise<CurrentUser> {
  const h = await headers();

  const session = await auth.api.getSession({
    headers: h,
  });

  if (session == null) {
    const url = buildSignInUrl({
      headers: h,
    });
    redirect(url);
  }

  return currentUserSchema.parse(session.user);
}
