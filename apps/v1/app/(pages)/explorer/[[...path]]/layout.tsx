import { Header } from "@/components/ui/headers/header";
import { PATHS } from "@/lib/path/paths";
import { SearchProvider } from "@/providers/search-provider";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    // ここに書いたプロバイダーはページ遷移後に状態をリセット
    <SearchProvider>
      <div className="flex flex-col min-h-screen">
        <Header title="Explorer" basePath={PATHS.client.explorer.root} />
        <main className="flex-1 flex">{children}</main>
      </div>
    </SearchProvider>
  );
}
