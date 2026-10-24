import { SignInForm } from "@/app/(pages)/(auth)/sign-in/_components/sign-in-form";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const { redirectTo } = await searchParams;

  return (
    <div className="flex items-center justify-center w-full min-h-full">
      <SignInForm redirectTo={redirectTo} />
    </div>
  );
}
