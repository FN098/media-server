import { Header } from "@/app/components/ui/header";
import { SearchProvider } from "@/app/providers/search-provider";
import { ViewModeProvider } from "@/app/providers/view-mode-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ViewModeProvider>
      <SearchProvider>
        <Header basePath="/dashboard" />
        {children}
      </SearchProvider>
    </ViewModeProvider>
  );
}
