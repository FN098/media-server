import { AppSidebar } from "@/app/components/ui/app-sidebar";
import { Header } from "@/app/components/ui/header";
import { SearchProvider } from "@/app/providers/search-provider";
import { ViewModeProvider } from "@/app/providers/view-mode-provider";
import { SidebarProvider } from "@/shadcn/components/ui/sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full h-full">
        <ViewModeProvider>
          <SearchProvider>
            <Header />
            {children}
          </SearchProvider>
        </ViewModeProvider>
      </main>
    </SidebarProvider>
  );
}
