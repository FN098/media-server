import { Header } from "@/components/ui/headers/header";
import { pageMetas } from "@/lib/page-meta/meta";
import { SearchFocusProvider } from "@/providers/search-focus.provider";

const meta = pageMetas["trash"];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SearchFocusProvider>
      <div className="w-full h-svh flex flex-col overflow-hidden">
        <Header title={meta.title} icon={meta.icon} basePath={meta.url} />
        <main className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {children}
        </main>
      </div>
    </SearchFocusProvider>
  );
}
