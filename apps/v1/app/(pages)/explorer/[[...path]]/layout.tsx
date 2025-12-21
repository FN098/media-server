import { Header } from "@/components/ui/header";
import { PATHS } from "@/lib/paths";
import { SearchProvider } from "@/providers/search-provider";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    // 検索キーワードはページ遷移後にリセット
    <SearchProvider>
      <Header title="Explorer" basePath={PATHS.client.explorer.root} />
      {children}
    </SearchProvider>
  );
}
