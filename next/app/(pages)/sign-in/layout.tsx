import { PageBackground } from "@/feature/background/ui/page-background";
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
      <main className="h-full">{children}</main>
    </div>
  );
}
