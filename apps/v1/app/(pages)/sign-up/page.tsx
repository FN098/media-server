import { FadeIn } from "@/components/ui/fade/fade-in";
import { SignUp } from "@/components/ui/pages/sign-up";
import { db } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SignUpPage() {
  const admin = await db.user.findFirst({
    where: { role: "admin" },
    select: { id: true },
  });

  return (
    <div className="flex items-center justify-center w-full h-full">
      <FadeIn>
        <SignUp hasAdmin={!!admin} />
      </FadeIn>
    </div>
  );
}
