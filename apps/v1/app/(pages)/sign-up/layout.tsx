import { AmbientBackground } from "@/components/ui/backgrounds/ambient-background";
import { resolvePageMeta } from "@/lib/page-meta/resolvers";

const meta = resolvePageMeta("sign-up");

export default function Layout({ children }: { children: React.ReactNode }) {
  if (!meta) return;

  return (
    <div className="relative flex flex-col min-h-screen overflow-hidden">
      <AmbientBackground accent={meta.accent} />
      <main className="flex-1 overflow-y-auto">
        <div className="flex w-full min-h-screen items-center justify-center">
          {children}
        </div>
      </main>
    </div>
  );
}
