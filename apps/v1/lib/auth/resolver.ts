import { authenticate, parseCredentials } from "@/lib/auth/basic-auth";
import { User } from "@/lib/auth/types";
import { headers } from "next/headers";

export async function resolveCurrentUserOrThrow(): Promise<User> {
  const user = await resolveCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function resolveCurrentUser(): Promise<User | null> {
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
