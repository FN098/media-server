import { DashboardHeader } from "@/app/(pages)/(dashboard)/_components/header";
import { PageBackground } from "@/app/(pages)/_components/background/page-background";
import { resolvePageMeta } from "@/app/(pages)/_lib/page-meta/resolvers";

const meta = resolvePageMeta("sandbox");

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
        accent={meta.accent}
      />
      <main className="h-full">{children}</main>
    </div>
  );
}
