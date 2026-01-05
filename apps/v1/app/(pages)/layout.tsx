import { AppSidebar } from "@/components/ui/sidebars/app-sidebar";
import { SidebarProvider } from "@/shadcn/components/ui/sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="w-full h-full">
        <AppSidebar />
        {children}
      </div>
    </SidebarProvider>
  );
}
