"use client";

import { LocalRecentDateValue } from "@/components/ui/local-date";
import type { VisitedFolder } from "@/generated/prisma/client";
import { getClientExplorerPath } from "@/lib/path/helpers";
import { splitDirPath } from "@/lib/utils/path";
import { Button } from "@/shadcn/components/ui/button";
import { Clock, Folder, History } from "lucide-react"; // アイコンを追加
import Link from "next/link";

type RecentFoldersProps = {
  folders: VisitedFolder[];
};

export function RecentFolders({ folders }: RecentFoldersProps) {
  if (folders.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
          <History className="w-6 h-6 text-muted-foreground/40" />
        </div>
        <p className="text-sm text-muted-foreground/60">履歴がまだありません</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md h-80 overflow-y-auto">
      {folders.map((folder) => {
        const { folderName, parentPath } = splitDirPath(folder.dirPath);

        return (
          <Button
            key={folder.dirPath}
            variant="ghost"
            asChild
            className="w-full h-auto py-3 px-4 justify-start hover:bg-accent group transition-all"
          >
            <Link
              href={encodeURI(getClientExplorerPath(folder.dirPath))}
              className="flex items-center gap-3"
            >
              {/* アイコン部分 */}
              <div className="p-2 bg-primary/10 rounded-md text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Folder className="w-5 h-5" />
              </div>

              {/* テキスト部分 */}
              <div className="flex flex-col items-start overflow-hidden text-left">
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
                <LocalRecentDateValue value={folder.lastViewedAt} />
              </div>
            </Link>
          </Button>
        );
      })}
    </div>
  );
}
