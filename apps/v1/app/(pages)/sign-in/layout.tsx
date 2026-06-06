import { PageBackground } from "@/components/ui/backgrounds/page-background";
import { resolvePageMeta } from "@/lib/page-meta/resolvers";

const meta = resolvePageMeta("sign-in");

export default function Layout({ children }: { children: React.ReactNode }) {
  if (!meta) return;

  return (
    <div className="flex flex-col min-h-screen">
      <PageBackground accent={meta.accent} />
      <div className="flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950">
        {children}
      </div>
    </div>
  );
}
