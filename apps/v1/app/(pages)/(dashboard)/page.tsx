import { USER } from "@/basic-auth";
import { RecentFolders } from "@/components/ui/recent-folders";
import { getRecentFolders } from "@/lib/folder/repository";
import { Button } from "@/shadcn/components/ui/button";
import { FolderPlus, History } from "lucide-react"; // アイコン追加
import Link from "next/link";

export default async function Page() {
  // TODO: ユーザー認証機能実装後に差し替える
  const folders = await getRecentFolders(USER);

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* ヒーローセクション: メインアクション */}
      <section className="text-center mb-16">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl mb-4">
          Welcome back
        </h1>
        <p className="text-muted-foreground text-lg mb-8">
          エクスプローラーを開始して、作業を続けましょう。
        </p>
        <Button
          asChild
          size="lg"
          className="px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all"
        >
          <Link href="/explorer" className="flex items-center gap-2">
            <FolderPlus className="w-5 h-5" />
            Start Exploring
          </Link>
        </Button>
      </section>

      {/* 最近の履歴セクション */}
      <section className="flex flex-col items-center">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-4 px-1 text-muted-foreground">
            <History className="w-4 h-4" />
            <h2 className="text-sm font-semibold uppercase tracking-wider">
              Recently opened
            </h2>
          </div>

          <RecentFolders folders={folders} />
        </div>
      </section>
    </div>
  );
}
