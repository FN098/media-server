"use client";

import { togglePinVisitedFolderAction } from "@/actions/folder-actions";
import { LocalRecentDate } from "@/components/ui/dates/local-recent-date";
import type { VisitedFolder } from "@/generated/prisma/client";
import { getClientExplorerPath } from "@/lib/path/helpers";
import { splitDirPath } from "@/lib/utils/path";
import { Button } from "@/shadcn/components/ui/button";
import { cn } from "@/shadcn/lib/utils";
import { Clock, Folder, History, Pin } from "lucide-react";
import Link from "next/link";
import { useCallback, useTransition } from "react";

interface RecentFoldersProps {
  folders: VisitedFolder[];
}

export function RecentFolders({ folders }: RecentFoldersProps) {
  const [isPending, startTransition] = useTransition();

  const handleTogglePin = useCallback((folder: VisitedFolder) => {
    startTransition(async () => {
      await togglePinVisitedFolderAction(folder.dirPath, folder.isPinned);
    });
  }, []);

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
    <div className="w-full max-w-md h-80 overflow-y-auto space-y-1 pr-1">
      {folders.map((folder) => {
        const { folderName, parentPath } = splitDirPath(folder.dirPath);

        return (
          <div key={folder.dirPath} className="relative group/wrapper w-full">
            {/* メインのフォルダリンクボタン */}
            <Button
              variant="ghost"
              asChild
              className={cn(
                "w-full h-auto py-3 pl-4 pr-16 justify-start hover:bg-accent group transition-all",
                folder.isPinned && "bg-secondary/40" // 👈 ピン留め時は背景を少し変える
              )}
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

                {/* 右側の日付 */}
                <div className="ml-auto text-[10px] text-muted-foreground flex items-center gap-1 hover:opacity-30 transition-opacity">
                  <Clock className="w-3 h-3" />
                  <LocalRecentDate value={folder.lastViewedAt} />
                </div>
              </Link>
            </Button>

            {/* ピン留めボタン（絶対配置：ホバー時、またはピン留め中のみ表示） */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                className={cn(
                  "h-8 w-8 text-muted-foreground/50 hover:text-primary transition-opacity",
                  !folder.isPinned &&
                    "opacity-0 group-hover/wrapper:opacity-100 focus:opacity-100",
                  isPending && "opacity-50"
                )}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation(); // Linkへの伝播を防止
                  handleTogglePin(folder);
                }}
              >
                <Pin
                  className={cn(
                    "w-4 h-4",
                    folder.isPinned
                      ? "fill-primary text-primary rotate-0"
                      : "rotate-45"
                  )}
                />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
