import { PageBackground } from "@/app/(pages)/_components/background/page-background";
import { resolvePageMeta } from "@/app/(pages)/_lib/page-meta/resolvers";
import { DashboardHeader } from "@/feature/header/components/dashboard-header";

const meta = resolvePageMeta("settings");

export default function Layout({ children }: { children: React.ReactNode }) {
  if (!meta) return;

  return (
    <div className="relative w-full h-screen flex flex-col">
      <PageBackground
        accent={meta.accent}
        backgroundType={meta.backgroundType}
      />
      <DashboardHeader
        title={meta.title}
        icon={meta.icon}
        baseUrl={meta.url}
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
