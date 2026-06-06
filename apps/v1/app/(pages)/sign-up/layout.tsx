import { PageBackground } from "@/components/ui/backgrounds/page-background";
import { resolvePageMeta } from "@/lib/page-meta/resolvers";

const meta = resolvePageMeta("sign-up");

export default function Layout({ children }: { children: React.ReactNode }) {
  if (!meta) return;

  return (
    <div className="flex flex-col min-h-screen">
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
        <PageBackground accent={meta.accent} />
        {children}
      </div>
    </div>
  );
}
