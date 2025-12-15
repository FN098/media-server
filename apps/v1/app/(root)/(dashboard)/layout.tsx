import { Header } from "@/app/components/ui/header";
import { PATHS } from "@/app/lib/paths";
import { SearchProvider } from "@/app/providers/search-provider";
import { ViewModeProvider } from "@/app/providers/view-mode-provider";

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
