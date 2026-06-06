import { PageBackground } from "@/components/ui/backgrounds/page-background";
import { Header } from "@/components/ui/headers/header";
import { resolvePageMeta } from "@/lib/page-meta/resolvers";
import { SearchFocusProvider } from "@/providers/search-focus.provider";

const meta = resolvePageMeta("trash");

export default function Layout({ children }: { children: React.ReactNode }) {
  if (!meta) return;

  return (
    <SearchFocusProvider>
      <div className="relative w-full min-h-svh flex flex-col overflow-hidden">
        <PageBackground accent={meta.accent} />
        <Header
          title={meta.title}
          icon={meta.icon}
          basePath={meta.url}
          accent={meta.accent}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="flex w-full h-full items-center justify-center">
            {children}
          </div>
        </main>
      </div>
    </SearchFocusProvider>
  );
}
