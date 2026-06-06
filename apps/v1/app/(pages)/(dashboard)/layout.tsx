import { PageBackground } from "@/components/ui/backgrounds/page-background";
import { Header } from "@/components/ui/headers/header";
import { resolvePageMeta } from "@/lib/page-meta/resolvers";

const meta = resolvePageMeta("dashboard");

export default function Layout({ children }: { children: React.ReactNode }) {
  if (!meta) return;

  return (
    <div className="relative flex flex-col h-screen">
      <Header
        title={meta.title}
        icon={meta.icon}
        basePath={meta.url}
        features={{ navigation: false, search: false, viewMode: false }}
        accent={meta.accent}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="relative flex w-full h-full items-center justify-center overflow-hidden">
          <PageBackground accent={meta.accent} />
          {children}
        </div>
      </main>
    </div>
  );
}
