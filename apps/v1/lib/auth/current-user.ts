import { auth } from "@/lib/auth/better-auth";
import { AuthUser, AuthUserSchema } from "@/lib/auth/schemas";
import { buildSignInUrl } from "@/lib/auth/sign-in-url";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function resolveCurrentUser(): Promise<AuthUser | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session == null) return null;

  return AuthUserSchema.safeParse(session.user).data ?? null;
}

export async function resolveCurrentUserOrThrow(): Promise<AuthUser> {
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

  return AuthUserSchema.parse(session.user);
}
