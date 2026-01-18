import { Header } from "@/components/ui/headers/header";
import { PATHS } from "@/lib/path/paths";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full h-svh flex flex-col overflow-hidden">
      <Header
        title="Maintenance"
        basePath={PATHS.client.favorites.root}
        features={{
          navigation: false,
          search: false,
          viewMode: false,
        }}
      />
      <main className="flex flex-col flex-1 min-h-0 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
