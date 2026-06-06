import { auth } from "@/lib/auth/better-auth";

type AuthUser = {
  id: string;
  name: string;
};

export async function resolveCurrentUser(): Promise<AuthUser | null> {
  const session = await auth.api.getSession();
  return session?.user ?? null;
}

export async function resolveCurrentUserOrThrow(): Promise<AuthUser> {
  const user = await resolveCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}
