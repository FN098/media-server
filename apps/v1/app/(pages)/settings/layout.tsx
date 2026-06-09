import { PageBackground } from "@/components/ui/backgrounds/page-background";
import { Header } from "@/components/ui/headers/header";
import { resolvePageMeta } from "@/lib/page-meta/resolvers";

const meta = resolvePageMeta("settings");

export default function Layout({ children }: { children: React.ReactNode }) {
  if (!meta) return;

  return (
    <div className="relative w-full min-h-svh flex flex-col overflow-hidden">
      <PageBackground meta={meta} />
      <Header
        title={meta.title}
        icon={meta.icon}
        basePath={meta.url}
        features={{
          navigation: false,
          search: false,
          viewMode: false,
        }}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="flex w-full h-full items-center justify-center">
          {children}
        </div>
      </main>
    </div>
  );
}
