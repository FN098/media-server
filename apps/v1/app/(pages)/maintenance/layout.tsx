import { PageBackground } from "@/components/ui/backgrounds/page-background";
import { Header } from "@/components/ui/headers/header";
import { resolvePageMeta } from "@/lib/page-meta/resolvers";

const meta = resolvePageMeta("maintenance");

export default function Layout({ children }: { children: React.ReactNode }) {
  if (!meta) return;

  return (
    <div className="w-full h-svh flex flex-col">
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
        <div className="relative flex flex-col flex-1 min-h-0 overflow-hidden">
          <PageBackground accent={meta.accent} />
          {children}
        </div>
      </main>
    </div>
  );
}
