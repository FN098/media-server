import { Header } from "@/components/ui/header";
import { PATHS } from "@/lib/path/paths";
import { SearchProvider } from "@/providers/search-provider";
import { ViewModeProvider } from "@/providers/view-mode-provider";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ViewModeProvider>
      <SearchProvider>
        <div className="flex flex-col min-h-screen">
          <Header
            title="Dashboard"
            basePath={PATHS.client.dashboard.root}
            features={{ navigation: false, search: false, viewMode: false }}
          />
          <main className="flex-1 flex items-center justify-center">
            {children}
          </main>
        </div>
      </SearchProvider>
    </ViewModeProvider>
  );
}
