import { SignIn } from "@/components/ui/pages/sign-in";
import { Suspense } from "react";

export default function SignInPage() {
  return (
    <div className="flex items-center justify-center w-full h-full">
      <Suspense>
        <SignIn />
      </Suspense>
    </div>
  );
}
