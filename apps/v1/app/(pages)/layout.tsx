import { AppMenuSidebar } from "@/feature/sidebar/ui/app-menu-sidebar";
import { ViewerHeaderPinnedProvider } from "@/feature/viewer/providers/viewer-header-pinned-provider";
import { SidebarProvider } from "@/shadcn/components/ui/sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <ViewerHeaderPinnedProvider>
      <SidebarProvider defaultOpen={false}>
        <div className="w-full h-full">
          <AppMenuSidebar />
          {children}
        </div>
      </SidebarProvider>
    </ViewerHeaderPinnedProvider>
  );
}
