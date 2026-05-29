import { Header } from "@/components/ui/headers/header";
import { pageMetas } from "@/lib/page-meta/meta";

const meta = pageMetas["dashboard"];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title={meta.title}
        icon={meta.icon}
        basePath={meta.url}
        features={{ navigation: false, search: false, viewMode: false }}
      />
      <main className="flex-1 flex items-center justify-center">
        {children}
      </main>
    </div>
  );
}
