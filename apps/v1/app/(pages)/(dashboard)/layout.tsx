import { PageBackground } from "@/components/ui/backgrounds/page-background";
import { Header } from "@/components/ui/headers/header";
import { resolvePageMeta } from "@/lib/page-meta/resolvers";

const meta = resolvePageMeta("dashboard");

export default function Layout({ children }: { children: React.ReactNode }) {
  if (!meta) return;

  return (
    <div className="relative w-full h-screen flex flex-col">
      <PageBackground meta={meta} />
      <Header
        title={meta.title}
        icon={meta.icon}
        basePath={meta.url}
        features={{ navigation: false, search: false, viewMode: false }}
        accent={meta.accent}
      />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
