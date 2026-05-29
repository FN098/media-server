"use client";

import { TextWithTooltip } from "@/components/ui/texts/text-with-tooltip";
import { copyNodesAction, getSubDirectoriesAction } from "@/lib/media/actions";
import { Button } from "@/shadcn/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shadcn/components/ui/dialog";
import { ScrollArea } from "@/shadcn/components/ui/scroll-area";
import { ChevronLeft, ChevronRight, Copy, Folder } from "lucide-react";
import { dirname } from "path";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

interface CopyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceNodes: { path: string; name: string }[];
  initialDirPath?: string; // ナビゲーションの開始ディレクトリパス
}

export function CopyDialog({
  open,
  onOpenChange,
  sourceNodes,
  initialDirPath = "/",
}: CopyDialogProps) {
  const [targetDirPath, setTargetDirPath] = useState(initialDirPath);
  const [dirs, setDirs] = useState<{ name: string; path: string }[]>([]);

  const [isNavigating, startNavigating] = useTransition();
  const [isCopying, startCopying] = useTransition();
  const isLoading = isNavigating || isCopying;

  // フォルダ一覧を取得
  const fetchDirs = (path: string) => {
    startNavigating(async () => {
      const result = await getSubDirectoriesAction(path);
      if (result.success) {
        // コピー元自身・およびその子孫フォルダは選択肢から除外（再帰ループ防止）
        const filtered = result.directories!.filter(
          (d) =>
            !sourceNodes.some(
              (sn) => d.path === sn.path || d.path.startsWith(sn.path + "/")
            )
        );
        setDirs(filtered);
        setTargetDirPath(path);
      } else {
        toast.error(result.error);
      }
    });
  };

  // コピー実行
  const handleCopy = () => {
    startCopying(async () => {
      const paths = sourceNodes.map((n) => n.path);
      const result = await copyNodesAction(paths, targetDirPath);

      if (result.failed === 0) {
        toast.success(`${result.success}件のアイテムをコピーしました`);
        onOpenChange(false);
      } else {
        toast.error(
          `${result.failed}件のコピーに失敗しました\n${result.errors.join("\n")}`
        );
      }
    });
  };

  // 対象のフォルダを開く
  const handleOpen = (path: string) => {
    fetchDirs(path);
  };

  // 親フォルダに戻る
  const handleBack = () => {
    const parent = dirname(targetDirPath).replace(/\\/g, "/");
    fetchDirs(parent === "." ? "/" : parent);
  };

  // ダイアログ初期化
  useEffect(() => {
    if (open) {
      fetchDirs(initialDirPath);
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
          <DialogTitle>コピー先を選択</DialogTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground break-all bg-muted p-2 rounded">
            <Folder className="h-4 w-4 shrink-0" />
            {targetDirPath}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto flex flex-col gap-2">
          {targetDirPath !== "/" && (
            <Button
              variant="ghost"
              className="w-full justify-start text-primary"
              onClick={() => handleBack()}
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
                    onClick={() => handleOpen(dir.path)}
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

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCopying}
          >
            キャンセル
          </Button>
          <Button
            onClick={handleCopy}
            disabled={isLoading || initialDirPath === targetDirPath}
          >
            {isCopying ? (
              "コピー中..."
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                ここにコピー
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
