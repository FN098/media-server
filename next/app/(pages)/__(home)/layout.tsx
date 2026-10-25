import { PageBackground } from "@/feature/background/components/page-background";
import { DashboardHeader } from "@/feature/header/components/dashboard-header";
import { getPageMeta } from "@/feature/page-meta/lib/page-meta";

const meta = getPageMeta("dashboard");

export default function Layout({ children }: { children: React.ReactNode }) {
  debugger;
  if (!meta) return;

  return (
    <div className="relative w-full h-screen flex flex-col">
      <PageBackground accent={meta.accent} />
      <DashboardHeader title={meta.title} accent={meta.accent} />
      <main className="h-full">{children}</main>
    </div>
  );
}
