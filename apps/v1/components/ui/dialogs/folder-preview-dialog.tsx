"use client";

import { updateFolderPreviewAction } from "@/actions/folder-actions";
import { getSubDirectoriesAction } from "@/actions/media-actions";
import { TextWithTooltip } from "@/components/ui/texts/text-with-tooltip";
import { MediaNode } from "@/lib/media/types";
import { Button } from "@/shadcn/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shadcn/components/ui/dialog";
import { ScrollArea } from "@/shadcn/components/ui/scroll-area";
import { ChevronLeft, ChevronRight, Folder, Save } from "lucide-react";
import path, { dirname } from "path";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

interface FolderPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetNode: MediaNode | null;
}

export function FolderPreviewDialog({
  open,
  onOpenChange,
  targetNode,
}: FolderPreviewDialogProps) {
  debugger;
  const initialDirPath = targetNode ? path.dirname(targetNode.path) : "/";

  // ナビゲーション用の現在のパス
  const [currentPath, setCurrentPath] = useState(initialDirPath);
  const [dirs, setDirs] = useState<{ name: string; path: string }[]>([]);

  const [isNavigating, startNavigating] = useTransition();
  const [isSaving, startSaving] = useTransition();
  const isLoading = isNavigating || isSaving;

  // フォルダ一覧を取得
  const fetchDirs = (path: string) => {
    startNavigating(async () => {
      const result = await getSubDirectoriesAction(path);
      if (result.success) {
        setDirs(result.directories!);
      } else {
        toast.error(result.error);
      }
    });
  };

  // 保存実行
  const performSave = () => {
    if (!currentPath || !targetNode) return;

    startSaving(async () => {
      const result = await updateFolderPreviewAction(
        currentPath,
        targetNode.path
      );

      if (result.success) {
        toast.success("プレビューを設定しました");
        onOpenChange(false);
      } else {
        toast.error(result.error);
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
      <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            プレビュー設定:{" "}
            <span className="text-primary truncate">{targetNode?.name}</span>
          </DialogTitle>
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted p-2 rounded">
            <Folder className="h-3 w-3 shrink-0" />
            {currentPath}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto flex flex-col gap-2">
          {currentPath !== "/" && (
            <Button
              variant="ghost"
              className="w-full justify-start text-primary"
              onClick={() => goBackParentFolder()}
              disabled={isSaving || isNavigating}
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

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            キャンセル
          </Button>
          <Button onClick={performSave} disabled={isLoading || !currentPath}>
            {isSaving ? (
              "設定中..."
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                ここに設定
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
