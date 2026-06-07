import { APP_CONFIG } from "@/app.config";
import { RecentFolders } from "@/components/ui/lists/recent-folders";
import { resolveCurrentUserOrThrow } from "@/lib/auth/current-user";
import { getRecentFolders } from "@/lib/folder/repository";
import { Button } from "@/shadcn/components/ui/button";
import { ArrowRight, FolderSearch2, History } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";

const RECENT_FOLDERS_LIMIT = 20;

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Dashboard | ${APP_CONFIG.meta.title}`,
};

export default async function DashboardPage() {
  const user = await resolveCurrentUserOrThrow();
  const folders = await getRecentFolders(user.id, RECENT_FOLDERS_LIMIT);

  return (
    <div className="w-full max-w-lg mx-6 flex flex-col gap-8">
      {/* ヒーロー */}
      <section className="text-center">
        <div className="flex items-center justify-center gap-2.5 mb-5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 border border-indigo-200 dark:bg-indigo-500/20 dark:border-indigo-500/30">
            <div className="h-2.5 w-2.5 rounded-sm bg-indigo-500 dark:bg-indigo-400" />
          </div>
          <span className="text-xs font-medium tracking-widest text-zinc-400 dark:text-zinc-500 uppercase">
            Media Server
          </span>
        </div>

        <p className="text-xs font-medium tracking-[0.12em] uppercase text-indigo-500 dark:text-indigo-400 mb-2">
          Welcome back
        </p>
        <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white mb-3">
          Dashboard
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-500 leading-relaxed">
          ファイル管理をよりスマートに。
          <br />
          直近の作業からすぐに再開できます。
        </p>

        <Button
          asChild
          className="mt-6 h-11 px-6 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white border-0 rounded-xl transition-colors group"
        >
          <Link href="/explorer" className="inline-flex items-center gap-2">
            <FolderSearch2 className="w-4 h-4" />
            Start Exploring
            <ArrowRight className="w-4 h-4 opacity-50 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </Button>
      </section>

      {/* 履歴 */}
      <section>
        <div className="flex items-center gap-2 mb-3 px-1">
          <History className="w-4 h-4 text-indigo-500" />
          <h2 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-600">
            Recently opened
          </h2>
        </div>

        <div className="relative rounded-2xl border border-zinc-200 dark:border-white/[0.06] bg-zinc-50 dark:bg-white/[0.03] backdrop-blur-xl overflow-hidden">
          {/* 上部アクセントライン */}
          <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-indigo-400/50 dark:via-indigo-500/40 to-transparent" />
          <div className="max-h-80 overflow-y-auto">
            <RecentFolders folders={folders} />
          </div>
        </div>
      </section>
    </div>
  );
}
