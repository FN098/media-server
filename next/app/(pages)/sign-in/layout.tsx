import { PageBackground } from "@/feature/background/components/page-background";
import { getPageMeta } from "@/feature/page-meta/lib/page-meta";

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
