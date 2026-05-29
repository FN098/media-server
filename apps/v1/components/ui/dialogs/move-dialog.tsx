"use client";

import { TextWithTooltip } from "@/components/ui/texts/text-with-tooltip";
import {
  getRecentFoldersAction,
  togglePinVisitedFolderAction,
} from "@/lib/folder/actions";
import { getSubDirectoriesAction, moveNodesAction } from "@/lib/media/actions";
import { Button } from "@/shadcn/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shadcn/components/ui/dialog";
import { ScrollArea } from "@/shadcn/components/ui/scroll-area";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shadcn/components/ui/tabs";
import { cn } from "@/shadcn/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Folder,
  FolderInput,
  Pin,
} from "lucide-react";
import { dirname } from "path";
import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

type DirectoryInfo = { name: string; path: string };

type RecentDirectoryInfo = DirectoryInfo & { pinned: boolean };

interface MoveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceNodes: { path: string }[];
  initialDirPath?: string;
}

export function MoveDialog({
  open,
  onOpenChange,
  sourceNodes,
  initialDirPath = "/",
}: MoveDialogProps) {
  const [currentPath, setCurrentPath] = useState(initialDirPath);
  const [dirs, setDirs] = useState<DirectoryInfo[]>([]);
  const [recentDirs, setRecentDirs] = useState<RecentDirectoryInfo[]>([]);

  const [activeTab, setActiveTab] = useState<string>("browse");

  const [isNavigating, startNavigating] = useTransition();
  const [isMoving, startMoving] = useTransition();
  const isLoading = isNavigating || isMoving;

  // フォルダ一覧を取得
  const fetchDirs = useCallback(
    (path: string) => {
      startNavigating(async () => {
        const result = await getSubDirectoriesAction(path);
        if (result.success) {
          // 移動対象自身や、その子孫フォルダは選択肢から除外する（ループ防止）
          const filtered = result.directories!.filter(
            (d) =>
              !sourceNodes.some(
                (sn) => d.path === sn.path || d.path.startsWith(sn.path + "/")
              )
          );
          setDirs(filtered);
        } else {
          toast.error(result.error);
        }
      });
    },
    [sourceNodes]
  );

  // 最近のフォルダを取得
  const fetchRecentDirs = useCallback(() => {
    startNavigating(async () => {
      const result = await getRecentFoldersAction();
      if (result.success) {
        // 移動対象自身や子孫フォルダは履歴からも除外しておく
        const filtered = (result.data ?? []).filter(
          (d: RecentDirectoryInfo) =>
            !sourceNodes.some(
              (sn) => d.path === sn.path || d.path.startsWith(sn.path + "/")
            )
        );
        setRecentDirs(filtered);
      }
    });
  }, [sourceNodes]);

  // 移動実行
  const performMove = useCallback(() => {
    if (!currentPath) return;

    startMoving(async () => {
      const paths = sourceNodes.map((n) => n.path);
      const result = await moveNodesAction(paths, currentPath);

      if (result.failed === 0) {
        toast.success(`${result.success}件のアイテムを移動しました`);
        onOpenChange(false);
      } else {
        toast.error(
          `${result.failed}件の移動に失敗しました\n${result.errors.join("\n")}`
        );
      }
    });
  }, [currentPath, onOpenChange, sourceNodes]);

  // 対象のフォルダを開く
  const openFolder = useCallback(
    (path: string) => {
      setCurrentPath(path);
      fetchDirs(path);
    },
    [fetchDirs]
  );

  // 最近のフォルダをクリックしたときの処理
  const handleSelectRecentFolder = (path: string) => {
    openFolder(path);
    setActiveTab("browse");
  };

  // 親フォルダに戻る
  const goBackParentFolder = useCallback(() => {
    const parent = dirname(currentPath).replace(/\\/g, "/");
    const path = parent === "." ? "/" : parent;
    openFolder(path);
  }, [currentPath, openFolder]);

  // ピン留めトグル処理
  const handleTogglePin = (path: string, currentPinned: boolean) => {
    startNavigating(async () => {
      const result = await togglePinVisitedFolderAction(path, currentPinned);
      if (result.success) {
        fetchRecentDirs();
      } else {
        toast.error(result.error || "ピン留めの更新に失敗しました");
      }
    });
  };

  // ダイアログ初期化
  useEffect(() => {
    if (open) {
      fetchDirs(initialDirPath);
      fetchRecentDirs();
    }
  }, [fetchDirs, fetchRecentDirs, initialDirPath, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[425px] h-[540px] flex flex-col" // タブの分、高さを少し広げています
        onEscapeKeyDown={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle>移動先を選択</DialogTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground break-all bg-muted p-2 rounded">
            <Folder className="h-4 w-4 shrink-0" />
            {currentPath}
          </div>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col min-h-0"
        >
          <TabsList className="grid w-full grid-cols-2 shrink-0 mb-2">
            <TabsTrigger value="browse">通常ブラウズ</TabsTrigger>
            <TabsTrigger value="recent" className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              最近のフォルダ
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="browse"
            className="flex-1 min-h-0 m-0 data-[state=active]:flex data-[state=active]:flex-col gap-2"
          >
            {currentPath !== "/" && (
              <Button
                variant="ghost"
                className="w-full justify-start text-primary shrink-0"
                onClick={() => goBackParentFolder()}
                disabled={isLoading}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                上の階層へ
              </Button>
            )}

            <div className="flex-1 min-h-0 relative border rounded-md">
              <ScrollArea className="h-full w-full p-2">
                {isLoading && (
                  <div className="absolute inset-0 bg-background/50 z-20 flex items-center justify-center backdrop-blur-[1px]">
                    <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  {dirs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      このフォルダにサブフォルダはありません
                    </div>
                  ) : (
                    dirs.map((dir) => (
                      <Button
                        key={dir.path}
                        variant="ghost"
                        className="w-full justify-between hover:bg-primary/10 group"
                        onClick={() => openFolder(dir.path)}
                        disabled={isLoading}
                      >
                        <div className="flex items-center">
                          <Folder className="mr-2 h-4 w-4 text-blue-500" />
                          <TextWithTooltip
                            text={dir.name}
                            className="max-w-[250px]"
                          />
                        </div>
                        <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100" />
                      </Button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent
            value="recent"
            className="flex-1 min-h-0 m-0 data-[state=active]:flex data-[state=active]:flex-col"
          >
            <div className="flex-1 min-h-0 relative border rounded-md">
              <ScrollArea className="h-full w-full p-2">
                {isLoading && (
                  <div className="absolute inset-0 bg-background/50 z-20 flex items-center justify-center backdrop-blur-[1px]">
                    <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  {recentDirs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      最近訪問したフォルダはありません
                    </div>
                  ) : (
                    recentDirs.map((dir) => (
                      <div
                        key={dir.path}
                        className="relative group/wrapper w-full"
                      >
                        {/* フォルダ選択ボタン */}
                        <Button
                          variant="ghost"
                          className={cn(
                            "w-full justify-start hover:bg-primary/10 group text-left pl-3 pr-12 py-6 h-auto", // ピンボタンのスペース確保と高さを少し調整
                            currentPath === dir.path &&
                              "bg-primary/5 font-medium",
                            dir.pinned && "bg-secondary/30" // ピン留め時の背景変更
                          )}
                          onClick={() => handleSelectRecentFolder(dir.path)}
                          disabled={isLoading}
                        >
                          <Folder className="mr-2 h-4 w-4 text-amber-500 shrink-0" />
                          <div className="flex flex-col items-start min-w-0 pr-2">
                            <span className="truncate w-full text-sm">
                              {dir.name || dir.path.split("/").pop()}
                            </span>
                            <span className="text-xs text-muted-foreground truncate w-full">
                              {dir.path}
                            </span>
                          </div>
                        </Button>

                        {/* ピン留めボタン（絶対配置：ホバー時、またはピン留め中のみ表示） */}
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10">
                          <Button
                            size="icon"
                            variant="ghost"
                            disabled={isLoading}
                            className={cn(
                              "h-8 w-8 text-muted-foreground/50 hover:text-primary transition-opacity",
                              !dir.pinned &&
                                "opacity-0 group-hover/wrapper:opacity-100 focus:opacity-100"
                            )}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation(); // フォルダ選択イベントへの伝播を防止
                              handleTogglePin(dir.path, dir.pinned);
                            }}
                          >
                            <Pin
                              className={cn(
                                "w-3.5 h-3.5 transition-transform duration-200",
                                dir.pinned
                                  ? "fill-primary text-primary rotate-0"
                                  : "rotate-45"
                              )}
                            />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2 pt-2 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            キャンセル
          </Button>
          <Button
            onClick={performMove}
            disabled={isLoading || currentPath === initialDirPath}
          >
            {isMoving ? (
              "移動中..."
            ) : (
              <>
                <FolderInput className="mr-2 h-4 w-4" />
                ここに移動
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
