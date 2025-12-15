import { Header } from "@/app/components/ui/header";
import { PATHS } from "@/app/lib/paths";
import { SearchProvider } from "@/app/providers/search-provider";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    // 検索キーワードはページ遷移後にリセット
    <SearchProvider>
      <Header title="Explorer" basePath={PATHS.client.explorer.root} />
      {children}
    </SearchProvider>
  );
}
