import { AppSidebar } from "@/components/ui/app-sidebar";
import { SidebarProvider } from "@/shadcn/components/ui/sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={false}>
      <main className="w-full h-full">
        <AppSidebar />
        {children}
      </main>
    </SidebarProvider>
  );
}
