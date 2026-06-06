import { Header } from "@/components/ui/headers/header";
import { resolvePageMeta } from "@/lib/page-meta/resolvers";

const meta = resolvePageMeta("dashboard");

export default function Layout({ children }: { children: React.ReactNode }) {
  if (!meta) return;

  return (
    <div className="flex flex-col h-screen">
      <Header
        title={meta.title}
        icon={meta.icon}
        basePath={meta.url}
        features={{ navigation: false, search: false, viewMode: false }}
      />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
