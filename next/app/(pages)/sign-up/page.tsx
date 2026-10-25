import { existsAdminUser } from "@/__lib/user/repository";
import { SignUpForm } from "@/feature/auth/sign-up/components/sign-up-form";

export const dynamic = "force-dynamic";

export default async function SignUpPage() {
  const hasAdmin = await existsAdminUser();

  return (
    <div className="flex items-center justify-center w-full min-h-full">
      <SignUpForm hasAdmin={hasAdmin} />
    </div>
  );
}
