import { auth } from "@/lib/auth/better-auth";
import { CurrentUser, currentUserSchema } from "@/lib/auth/current-user-schema";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session == null) return null;

  return currentUserSchema.safeParse(session.user).data ?? null;
}

export async function getCurrentUserOrThrow(): Promise<CurrentUser> {
  const h = await headers();

  const session = await auth.api.getSession({
    headers: h,
  });

  if (session == null) {
    redirect("/sign-in");
  }

  return currentUserSchema.parse(session.user);
}
