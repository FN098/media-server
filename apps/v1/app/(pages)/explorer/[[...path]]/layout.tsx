import { Header } from "@/components/ui/headers/header";
import { pageMetas } from "@/lib/meta";
import { SearchProvider } from "@/providers/search-provider";

const meta = pageMetas["explorer"];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    // ここに書いたプロバイダーはページ遷移後に状態をリセット
    <SearchProvider>
      <div className="w-full h-svh flex flex-col overflow-hidden">
        <Header title={meta.title} icon={meta.icon} basePath={meta.url} />
        <main className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {children}
        </main>
      </div>
    </SearchProvider>
  );
}
