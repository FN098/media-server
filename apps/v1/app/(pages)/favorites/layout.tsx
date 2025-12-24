import { Header } from "@/components/ui/header";
import { PATHS } from "@/lib/path";
import { SearchProvider } from "@/providers/search-provider";
import { ViewModeProvider } from "@/providers/view-mode-provider";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ViewModeProvider>
      <SearchProvider>
        <div className="flex flex-col min-h-screen">
          <Header title="Favorites" basePath={PATHS.client.favorites.root} />
          <main className="flex-1 flex">{children}</main>
        </div>
      </SearchProvider>
    </ViewModeProvider>
  );
}
