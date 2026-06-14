import { PageBackground } from "@/feature/background/ui/page-background";
import { Header } from "@/feature/header/ui/header";
import { resolvePageMeta } from "@/lib/page-meta/resolvers";

const meta = resolvePageMeta("settings");

export default function Layout({ children }: { children: React.ReactNode }) {
  if (!meta) return;

  return (
    <div className="relative w-full h-screen flex flex-col">
      <PageBackground
        accent={meta.accent}
        backgroundType={meta.backgroundType}
      />
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
      <main className="h-full">{children}</main>
    </div>
  );
}
