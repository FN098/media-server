"use client";

import type { RecentFolder } from "@/generated/prisma/client";
import { getClientExplorerPath } from "@/lib/path-helpers";
import { formatRecentDate } from "@/lib/utils/formatter";
import { Button } from "@/shadcn/components/ui/button";
import { Clock, Folder } from "lucide-react"; // アイコンを追加
import Link from "next/link";

type RecentFoldersProps = {
  folders: RecentFolder[];
};

export function RecentFolders({ folders }: RecentFoldersProps) {
  if (folders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-lg text-muted-foreground">
        <Folder className="w-8 h-8 mb-2 opacity-20" />
        <p className="text-sm">最近開いたフォルダはありません</p>
      </div>
    );
  }

  return (
    <div className="grid gap-2 w-full max-w-md">
      {folders.map((folder) => {
        // パスからフォルダ名と親パスを分解（ユーティリティ関数に切り出すと◎）
        const folderName =
          folder.dirPath.split(/[/\\]/).pop() || folder.dirPath;
        const parentPath =
          folder.dirPath.split(/[/\\]/).slice(0, -1).join("/") || "/";

        return (
          <Button
            key={folder.dirPath}
            variant="ghost"
            asChild
            className="w-full h-auto py-3 px-4 justify-start hover:bg-accent group transition-all"
          >
            <Link
              href={getClientExplorerPath(folder.dirPath)}
              className="flex items-center gap-3"
            >
              {/* アイコン部分 */}
              <div className="p-2 bg-primary/10 rounded-md text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Folder className="w-5 h-5" />
              </div>

              {/* テキスト部分 */}
              <div className="flex flex-col items-start overflow-hidden text-left mr-5">
                <span className="font-medium text-sm truncate w-full">
                  {folderName}
                </span>
                <span className="text-xs text-muted-foreground truncate w-full">
                  {parentPath}
                </span>
              </div>

              {/* 右側に日付を入れる場合（DBにupdatedAt等があれば） */}
              <div className="ml-auto text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatRecentDate(folder.lastViewedAt)}
              </div>
            </Link>
          </Button>
        );
      })}
    </div>
  );
}
