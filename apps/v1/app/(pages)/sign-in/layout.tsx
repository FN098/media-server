import { PageBackground } from "@/components/ui/backgrounds/page-background";
import { resolvePageMeta } from "@/lib/page-meta/resolvers";

const meta = resolvePageMeta("sign-in");

export default function Layout({ children }: { children: React.ReactNode }) {
  if (!meta) return;

  return (
    <div className="relative w-full h-screen flex flex-col">
      <PageBackground
        accent={meta.accent}
        backgroundType={meta.backgroundType}
      />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
