import { SignUp } from "@/components/ui/pages/sign-up";
import { db } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SignUpPage() {
  const admin = await db.user.findFirst({ where: { role: "admin" } });

  return <SignUp hasAdmin={!!admin} />;
}
