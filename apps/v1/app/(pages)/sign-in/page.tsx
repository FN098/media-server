import { SignIn } from "@/feature/page/sign-in";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const { redirectTo } = await searchParams;

  return (
    <div className="flex items-center justify-center w-full min-h-full">
      <SignIn redirectTo={redirectTo} />
    </div>
  );
}
