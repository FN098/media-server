import { Header } from "@/components/ui/headers/header";
import { PATHS } from "@/lib/path/paths";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="Settings"
        basePath={PATHS.client.settings.root}
        features={{
          navigation: false,
          search: false,
          viewMode: false,
        }}
      />
      <main className="flex-1 flex items-center justify-center">
        {children}
      </main>
    </div>
  );
}
