import { AmbientBackground } from "@/components/ui/backgrounds/ambient-background";
import { Header } from "@/components/ui/headers/header";
import { resolvePageMeta } from "@/lib/page-meta/resolvers";

const meta = resolvePageMeta("maintenance");

export default function Layout({ children }: { children: React.ReactNode }) {
  if (!meta) return;

  return (
    <div className="relative w-full min-h-svh flex flex-col overflow-hidden">
      <AmbientBackground accent={meta.accent} />
      <Header
        title={meta.title}
        icon={meta.icon}
        basePath={meta.url}
        features={{
          navigation: false,
          search: false,
          viewMode: false,
        }}
        accent={meta.accent}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="w-full h-full items-center justify-center">
          {children}
        </div>
      </main>
    </div>
  );
}
