import { APP_CONFIG } from "@/app.config";
import { USER } from "@/basic-auth";
import { RecentFolders } from "@/components/ui/history/recent-folders";
import { getRecentFolders } from "@/repositories/folder-repository";
import { Button } from "@/shadcn/components/ui/button";
import { ArrowRight, ArrowUpRight, FolderPlus, History } from "lucide-react"; // アイコン追加
import { Metadata } from "next";
import Link from "next/link";

const RECENT_FOLDERS_LIMIT = 10;

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Dashboard | ${APP_CONFIG.meta.title}`,
};

export default async function Page() {
  // TODO: ユーザー認証機能実装後に差し替える
  const folders = await getRecentFolders(USER, RECENT_FOLDERS_LIMIT);
  const hasHistory = folders.length > 0;

  return (
    <div className="w-full bg-background">
      <div className="max-w-4xl mx-auto px-6 py-24 flex flex-col items-center">
        {/* ヒーローセクション */}
        <section className="text-center mb-20">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6">
            Media Server
          </h1>

          <p className="text-muted-foreground text-lg md:text-xl max-w-lg mx-auto leading-relaxed break-keep">
            ファイル管理をよりスマートに。
            <br className="hidden md:block" />
            直近の作業からすぐに再開できます。
          </p>

          <div className="relative mt-10">
            <Button
              asChild
              size="lg"
              className="h-14 px-10 text-lg rounded-xl shadow-md hover:shadow-lg transition-all group"
            >
              <Link href="/explorer" className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5" />
                Start Exploring
                <ArrowRight className="w-4 h-4 ml-1 opacity-50 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>

            {!hasHistory && (
              <div className="absolute -right-12 top-3/2 -translate-y-1/2 hidden lg:flex items-center gap-2 text-primary animate-pulse">
                <ArrowUpRight className="w-6 h-6 rotate-[-90deg]" />
                <span className="text-sm font-medium">まずはここから！</span>
              </div>
            )}
          </div>
        </section>

        {/* 履歴セクション */}
        <section className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-6 px-1">
            <History className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Recently opened
            </h2>
          </div>

          <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
            <RecentFolders folders={folders} />
          </div>
        </section>
      </div>
    </div>
  );
}
