import { DashboardHeader } from "@/app/(pages)/(dashboard)/_components/header";
import { PageBackground } from "@/app/(pages)/_components/background/page-background";
import { getPageMeta } from "@/app/(pages)/_lib/page-meta";

const meta = getPageMeta("dashboard");

export default function Layout({ children }: { children: React.ReactNode }) {
  if (!meta) return;

  return (
    <div className="relative w-full h-screen flex flex-col">
      <PageBackground accent={meta.accent} />
      <DashboardHeader title={meta.title} accent={meta.accent} />
      <main className="h-full">{children}</main>
    </div>
  );
}
