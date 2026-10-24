import { PageBackground } from "@/app/(pages)/_components/background/page-background";
import { getPageMeta } from "@/app/(pages)/_lib/page-meta";

const meta = getPageMeta("sign-in");

export default function Layout({ children }: { children: React.ReactNode }) {
  if (!meta) return;

  return (
    <div className="relative w-full h-screen flex flex-col">
      <PageBackground accent={meta.accent} />
      <main className="h-full">{children}</main>
    </div>
  );
}
