import { Header } from "@/app/components/ui/header";
import { SearchProvider } from "@/app/providers/search-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // 検索キーワードはページ遷移後に破棄
    <SearchProvider>
      <Header basePath="/dashboard/explorer" />
      {children}
    </SearchProvider>
  );
}
