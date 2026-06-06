import { PageBackground } from "@/components/ui/backgrounds/page-background";
import { Header } from "@/components/ui/headers/header";
import { resolvePageMeta } from "@/lib/page-meta/resolvers";
import { SearchFocusProvider } from "@/providers/search-focus.provider";

const meta = resolvePageMeta("explorer");

export default function Layout({ children }: { children: React.ReactNode }) {
  if (!meta) return;

  return (
    <SearchFocusProvider>
      <div className="w-full h-svh flex flex-col overflow-hidden">
        <Header
          title={meta.title}
          icon={meta.icon}
          basePath={meta.url}
          accent={meta.accent}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="relative flex flex-col flex-1 min-h-0 overflow-hidden">
            <PageBackground accent={meta.accent} />
            {children}
          </div>
        </main>
      </div>
    </SearchFocusProvider>
  );
}
