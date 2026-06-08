"use client";

import { usePreviewDialog } from "@/hooks/dialogs/use-preview-dialog";
import { getBasename, getFilenameWithoutExt } from "@/lib/utils/filename";
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
  ChevronLeft,
  ChevronRight,
  FileBox,
  Folder,
  ImageIcon,
  Save,
} from "lucide-react";

interface PreviewDialogProps {
  dialog: ReturnType<typeof usePreviewDialog>;
}

export function PreviewDialog({ dialog }: PreviewDialogProps) {
  const {
    isOpen,
    previewPath,
    currentDir,
    dirs,
    files,
    selectedTargetPath,
    isLoading,
    isPending,
    setSelectedTargetPath,
    close,
    fetchContents,
    goBackParent,
    performSave,
  } = dialog;

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent
        className="sm:max-w-[450px] h-[550px] flex flex-col"
        onEscapeKeyDown={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-primary" />
            {getFilenameWithoutExt(previewPath || "no preview")}{" "}
            をプレビューに設定
          </DialogTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground break-all bg-muted p-2 rounded">
            <Folder className="h-4 w-4 shrink-0" />
            {currentDir}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-2 min-h-0">
          {currentDir !== "" && (
            <Button
              variant="ghost"
              className="w-full justify-start text-primary shrink-0"
              onClick={goBackParent}
              disabled={isLoading}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              上の階層へ
            </Button>
          )}

          {/* コンテンツ表示エリア */}
          <div className="flex-1 min-h-0 relative border rounded-md">
            <ScrollArea className="h-full w-full">
              {isLoading && (
                <div className="absolute inset-0 bg-background/50 z-20 flex items-center justify-center backdrop-blur-[1px]">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              )}

              <div className="p-2 flex flex-col gap-1">
                {/* 「このフォルダ自体を設定先にする」ボタン */}
                <Button
                  variant={
                    selectedTargetPath === currentDir ? "secondary" : "ghost"
                  }
                  className="w-full justify-start h-9 text-sm border-b rounded-none mb-1 shrink-0"
                  onClick={() => setSelectedTargetPath(currentDir)}
                  disabled={isLoading}
                >
                  <Folder className="mr-2 h-4 w-4 text-blue-500 fill-blue-500/20 shrink-0" />
                  <span className="font-bold text-primary truncate">
                    このフォルダに設定
                  </span>
                </Button>

                {/* サブフォルダ一覧 */}
                {dirs.map((dir) => (
                  <div
                    key={dir.path}
                    className="flex items-center gap-1 group w-full"
                  >
                    <Button
                      variant={
                        selectedTargetPath === dir.path ? "secondary" : "ghost"
                      }
                      // className="flex-1 justify-start h-9 text-sm px-2 min-w-0"
                      className="w-0 flex-grow justify-start h-9 text-sm px-2"
                      onClick={() => setSelectedTargetPath(dir.path)}
                      disabled={isLoading}
                    >
                      <Folder className="mr-2 h-4 w-4 text-blue-500 shrink-0" />
                      <span className="truncate">{dir.name}</span>
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 focus:opacity-100 shrink-0"
                      onClick={() => void fetchContents(dir.path)}
                      disabled={isLoading}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                {/* ファイル一覧 */}
                {files.map((file) => (
                  <Button
                    key={file.path}
                    variant={
                      selectedTargetPath === file.path ? "secondary" : "ghost"
                    }
                    className="w-full justify-start h-9 text-sm px-2 min-w-0"
                    onClick={() => setSelectedTargetPath(file.path)}
                    disabled={isLoading}
                  >
                    <FileBox className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="truncate">{file.name}</span>
                  </Button>
                ))}

                {dirs.length === 0 && files.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    このフォルダ内にアイテムはありません
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* フッター制御 */}
        <DialogFooter className="flex flex-col sm:flex-row gap-2 border-t pt-4 items-center shrink-0">
          <div className="text-[10px] text-muted-foreground truncate w-full text-left">
            {selectedTargetPath && (
              <span className="truncate" title={selectedTargetPath}>
                設定先: {getBasename(selectedTargetPath)}
              </span>
            )}
          </div>
          <div className="flex gap-2 shrink-0 w-full sm:w-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={close}
              disabled={isLoading || isPending}
            >
              キャンセル
            </Button>
            <Button
              size="sm"
              onClick={() => void performSave()}
              disabled={!selectedTargetPath || isLoading || isPending}
            >
              {isPending ? (
                "保存中..."
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  設定する
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
