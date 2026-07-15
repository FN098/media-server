"use client";

import { LocalRecentDate } from "@/feature/datetime/ui/local-recent-date";
import { togglePinVisitedFolderAction } from "@/feature/folder/actions/toggle-pin-visited";
import { useCanHoverContext } from "@/feature/general/providers/can-hover-provider";
import { VisitedFolder } from "@/lib/folder/types";
import { getClientExplorerPath } from "@/lib/path/helpers";
import { splitDirPath } from "@/lib/utils/path";
import { Button } from "@/shadcn/components/ui/button";
import { cn } from "@/shadcn/lib/utils";
import { Clock, Folder, History, Pin } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import { toast } from "sonner";

interface RecentFoldersProps {
  folders: VisitedFolder[];
}

export function RecentFolders({ folders }: RecentFoldersProps) {
  const [isPending, setIsPending] = useState(false);
  const canHover = useCanHoverContext();

  const handleTogglePin = useCallback(async (folder: VisitedFolder) => {
    setIsPending(true);
    try {
      const result = await togglePinVisitedFolderAction({
        dirPath: folder.dirPath,
        currentPinned: folder.isPinned,
      });
      if (!result.success) {
        toast.error(result.message);
      }
    } finally {
      setIsPending(false);
    }
  }, []);

  if (folders.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800/50 flex items-center justify-center mb-3">
          <History className="w-6 h-6 text-zinc-300 dark:text-zinc-600" />
        </div>
        <p className="text-sm text-zinc-400 dark:text-zinc-600">
          履歴がまだありません
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-1">
      {folders.map((folder) => {
        const { folderName, parentPath } = splitDirPath(folder.dirPath);

        return (
          <div key={folder.dirPath} className="relative group/wrapper w-full">
            <Button
              variant="ghost"
              asChild
              className={cn(
                "w-full h-auto py-3 pl-4 pr-16 justify-start hover:bg-zinc-100 dark:hover:bg-white/[0.06] group transition-all",
                folder.isPinned && "bg-zinc-100/70 dark:bg-white/[0.04]"
              )}
            >
              <Link
                href={encodeURI(getClientExplorerPath(folder.dirPath))}
                className="flex items-center gap-3"
              >
                {/* アイコン */}
                <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 rounded-md text-indigo-500 dark:text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white dark:group-hover:bg-indigo-500 dark:group-hover:text-white transition-colors">
                  <Folder className="w-5 h-5" />
                </div>

                {/* テキスト */}
                <div className="flex flex-col items-start overflow-hidden text-left">
                  <span className="font-medium text-sm truncate w-full text-zinc-800 dark:text-zinc-200">
                    {folderName}
                  </span>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500 truncate w-full">
                    {parentPath}
                  </span>
                </div>

                {/* 日付 */}
                <div className="ml-auto text-[10px] text-zinc-400 dark:text-zinc-600 flex items-center gap-1 hover:opacity-30 transition-opacity">
                  <Clock className="w-3 h-3" />
                  <LocalRecentDate value={folder.lastViewedAt} />
                </div>
              </Link>
            </Button>

            {/* ピン留めボタン */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                className={cn(
                  "h-8 w-8 text-zinc-400 dark:text-zinc-600 hover:text-indigo-500 transition-opacity",
                  !folder.isPinned &&
                    "opacity-0 group-hover/wrapper:opacity-100 focus:opacity-100",
                  !canHover && "opacity-100",
                  isPending && "opacity-50"
                )}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  void handleTogglePin(folder);
                }}
              >
                <Pin
                  className={cn(
                    "w-4 h-4",
                    folder.isPinned
                      ? "fill-indigo-500 text-indigo-500 rotate-0"
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
