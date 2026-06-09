import { FadeIn } from "@/components/ui/fade/fade-in";
import { SignIn } from "@/components/ui/pages/sign-in";

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center w-full h-full">
      <FadeIn>
        <SignIn />
      </FadeIn>
    </div>
  );
}
