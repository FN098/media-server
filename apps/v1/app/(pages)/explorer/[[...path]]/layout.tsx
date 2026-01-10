import { Header } from "@/components/ui/headers/header";
import { PATHS } from "@/lib/path/paths";
import { SearchProvider } from "@/providers/search-provider";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    // ここに書いたプロバイダーはページ遷移後に状態をリセット
    <SearchProvider>
      <div className="w-full h-svh flex flex-col overflow-hidden">
        <Header title="Explorer" basePath={PATHS.client.explorer.root} />
        <main className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {children}
        </main>
      </div>
    </SearchProvider>
  );
}
