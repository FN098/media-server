import { ViewModeProvider } from "@/app/explorer/ui/providers/view-mode-provider";
import { AppSidebar } from "@/app/ui/app-sidebar";
import { SidebarProvider } from "@/shadcn/components/ui/sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full h-full">
        <ViewModeProvider>{children}</ViewModeProvider>
      </main>
    </SidebarProvider>
  );
}
