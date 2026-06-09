import { MotionDiv } from "@/components/ui/framer-motion/motion-div";
import { SignIn } from "@/components/ui/pages/sign-in";

export default function SignInPage() {
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
        <SignIn />
      </MotionDiv>
    </div>
  );
}
