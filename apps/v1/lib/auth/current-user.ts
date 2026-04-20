import { authenticate, parseCredentials } from "@/lib/auth/basic-auth";
import { headers } from "next/headers";

type AuthUser = {
  id: string;
  name: string;
};

export async function resolveCurrentUserOrThrow(): Promise<AuthUser> {
  const user = await resolveCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function resolveCurrentUser(): Promise<AuthUser | null> {
  const h = await headers();

  const credentials = parseCredentials(h);
  if (!credentials) return null;

  const isValid = authenticate(credentials);
  if (!isValid) return null;

  return {
    id: credentials.user,
    name: credentials.user,
  };
}
