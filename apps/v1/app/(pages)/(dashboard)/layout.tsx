import { Header } from "@/components/ui/header";
import { PATHS } from "@/lib/paths";
import { SearchProvider } from "@/providers/search-provider";
import { ViewModeProvider } from "@/providers/view-mode-provider";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ViewModeProvider>
      <SearchProvider>
        <Header title="Dashboard" basePath={PATHS.client.dashboard.root} />
        {children}
      </SearchProvider>
    </ViewModeProvider>
  );
}
