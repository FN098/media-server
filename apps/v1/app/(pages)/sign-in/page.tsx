import { SignIn } from "@/components/ui/pages/sign-in";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const { redirectTo } = await searchParams;

  return (
    <div className="flex items-center justify-center w-full h-full">
      <SignIn redirectTo={redirectTo} />
    </div>
  );
}
