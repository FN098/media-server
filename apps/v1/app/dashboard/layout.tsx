import { AppSidebar } from "@/app/components/ui/app-sidebar";
import { SidebarProvider } from "@/shadcn/components/ui/sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full h-full">{children}</main>
    </SidebarProvider>
  );
}
