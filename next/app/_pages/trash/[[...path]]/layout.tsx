import { SearchFocusProvider } from "@/__feature/search/providers/search-focus-provider";
import { PageBackground } from "@/app/(pages)/_components/background/page-background";
import { resolvePageMeta } from "@/app/(pages)/_lib/page-meta/resolvers";
import { DashboardHeader } from "@/feature/header/components/dashboard-header";

const meta = resolvePageMeta("trash");

export default function Layout({ children }: { children: React.ReactNode }) {
  if (!meta) return;

  return (
    <SearchFocusProvider>
      <div className="relative w-full h-screen flex flex-col">
        <PageBackground
          accent={meta.accent}
          backgroundType={meta.backgroundType}
        />
        <DashboardHeader
          title={meta.title}
          icon={meta.icon}
          baseUrl={meta.url}
          accent={meta.accent}
        />
        <main>{children}</main>
      </div>
    </SearchFocusProvider>
  );
}
