import { MotionDiv } from "@/components/ui/framer-motion/motion-div";
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
      <MotionDiv
        initial={{ opacity: 1, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0,
          duration: 0.4,
          ease: "easeOut",
        }}
      >
        <SignUp hasAdmin={!!admin} />
      </MotionDiv>
    </div>
  );
}
