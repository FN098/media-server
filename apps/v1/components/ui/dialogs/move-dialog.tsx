"use client";

import {
  getSubDirectoriesAction,
  moveNodesAction,
} from "@/actions/media-actions";
import { TextWithTooltip } from "@/components/ui/texts/text-with-tooltip";
import { Button } from "@/shadcn/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shadcn/components/ui/dialog";
import { ScrollArea } from "@/shadcn/components/ui/scroll-area";
import { ChevronLeft, ChevronRight, Folder, FolderInput } from "lucide-react";
import { dirname } from "path";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

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
  const [dirs, setDirs] = useState<{ name: string; path: string }[]>([]);

  const [isNavigating, startNavigating] = useTransition();
  const [isMoving, startMoving] = useTransition();
  const isLoading = isNavigating || isMoving;

  // フォルダ一覧を取得
  const fetchDirs = (path: string) => {
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
  };

  // 移動実行
  const performMove = () => {
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
  };

  // 対象のフォルダを開く
  const openFolder = (path: string) => {
    setCurrentPath(path);
    fetchDirs(path);
  };

  // 親フォルダに戻る
  const goBackParentFolder = () => {
    const parent = dirname(currentPath).replace(/\\/g, "/");
    const path = parent === "." ? "/" : parent;
    openFolder(path);
  };

  // ダイアログ初期化
  useEffect(() => {
    if (open) {
      fetchDirs(initialDirPath);
      setCurrentPath(initialDirPath);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[425px] h-[500px] flex flex-col"
        onEscapeKeyDown={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle>移動先を選択</DialogTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground break-all bg-muted p-2 rounded">
            <Folder className="h-4 w-4 shrink-0" />
            {currentPath}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto flex flex-col gap-2">
          {currentPath !== "/" && (
            <Button
              variant="ghost"
              className="w-full justify-start text-primary"
              onClick={() => goBackParentFolder()}
              disabled={isLoading}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              上の階層へ
            </Button>
          )}

          <ScrollArea className="flex-1 overflow-auto border rounded-md p-2 relative">
            {/* スピナー */}
            {isLoading && (
              <div className="absolute inset-0 bg-background/50 z-20 flex items-center justify-center backdrop-blur-[1px]">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            )}

            {/* フォルダー一覧 */}
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
                    <div className="flex items-center ">
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

        <DialogFooter className="gap-2">
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
