import { SignUpForm } from "@/app/(pages)/(auth)/sign-up/_components/sign-up-form";
import { existsAdminUser } from "@/lib/user/repository";

export const dynamic = "force-dynamic";

export default async function SignUpPage() {
  const hasAdmin = await existsAdminUser();

  return (
    <div className="flex items-center justify-center w-full min-h-full">
      <SignUpForm hasAdmin={hasAdmin} />
    </div>
  );
}
