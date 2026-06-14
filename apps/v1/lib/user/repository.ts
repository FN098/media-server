import type { User } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export async function findUserById(id: string): Promise<User | null> {
  return await prisma.user.findUnique({
    where: { id },
  });
}

export async function findUserByIdOrThrow(id: string): Promise<User> {
  return await prisma.user.findUniqueOrThrow({
    where: { id },
  });
}

export async function existsAdminUser() {
  const admin = await prisma.user.findFirst({
    where: { role: "admin" },
    select: { id: true },
  });

  return !!admin;
}
