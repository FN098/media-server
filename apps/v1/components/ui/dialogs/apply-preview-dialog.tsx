"use client";

import {
  getFolderMediaFilesAction,
  getSubDirectoriesAction,
} from "@/lib/media/actions";
import { updatePreviewAction } from "@/lib/preview/actions";
import { getFilenameWithoutExt } from "@/lib/utils/filename";
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
  Image as ImageIcon,
  Save,
} from "lucide-react";
import path, { dirname } from "path";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

interface ApplyPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewPath: string | null; // プレビューとして使いたいメディアのパス
}

export function ApplyPreviewDialog({
  open,
  onOpenChange,
  previewPath,
}: ApplyPreviewDialogProps) {
  // ナビゲーション用の現在のディレクトリ
  const [currentDir, setCurrentDir] = useState("/");
  const [dirs, setDirs] = useState<{ name: string; path: string }[]>([]);
  const [files, setFiles] = useState<{ name: string; path: string }[]>([]);

  // どのパスを設定先（target）として選択したか
  const [selectedTargetPath, setSelectedTargetPath] = useState<string | null>(
    null
  );

  const [isNavigating, startNavigating] = useTransition();
  const [isSaving, startSaving] = useTransition();
  const isLoading = isNavigating || isSaving;

  const fetchContents = (dirPath: string) => {
    startNavigating(async () => {
      const [dirRes, fileRes] = await Promise.all([
        getSubDirectoriesAction(dirPath),
        getFolderMediaFilesAction(dirPath),
      ]);

      if (dirRes.success && fileRes.success) {
        setDirs(dirRes.directories || []);
        setFiles(fileRes.files || []);
        setCurrentDir(dirPath);
        setSelectedTargetPath(dirPath);
      }
    });
  };

  useEffect(() => {
    if (open && previewPath) {
      const initialDir = dirname(previewPath).replace(/\\/g, "/") || "/";
      fetchContents(initialDir);
    }
  }, [open, previewPath]);

  const handleSave = () => {
    if (!previewPath || !selectedTargetPath) return;
    startSaving(async () => {
      const result = await updatePreviewAction(selectedTargetPath, previewPath);
      if (result.success) {
        toast.success("プレビューを設定しました");
        onOpenChange(false);
      } else {
        toast.error(result.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[450px] h-[550px] flex flex-col"
        onEscapeKeyDown={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-primary" />
            この画像をプレビューに設定
          </DialogTitle>
          <div className="text-[10px] text-muted-foreground bg-muted p-2 rounded truncate">
            素材: {getFilenameWithoutExt(previewPath ?? "no preview")}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-2">
          {/* 現在の階層表示 & 戻る */}
          <div className="flex items-center gap-2">
            {currentDir !== "/" && (
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() =>
                  fetchContents(dirname(currentDir).replace(/\\/g, "/"))
                }
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            <div className="text-xs font-medium truncate flex-1 bg-accent/50 px-2 py-1 rounded">
              {currentDir}
            </div>
          </div>

          <ScrollArea className="flex-1 min-h-0 border rounded-md">
            <div className="p-2 flex flex-col gap-1">
              {/* 「このフォルダ自体を設定先にする」ボタン */}
              <Button
                variant={
                  selectedTargetPath === currentDir ? "secondary" : "ghost"
                }
                className="w-full justify-start h-9 text-sm border-b rounded-none mb-1"
                onClick={() => setSelectedTargetPath(currentDir)}
              >
                <Folder className="mr-2 h-4 w-4 text-blue-500 fill-blue-500/20" />
                <span className="font-bold text-primary">
                  このフォルダに設定
                </span>
              </Button>

              {/* サブフォルダ一覧 */}
              {dirs.map((dir) => (
                <div key={dir.path} className="flex items-center gap-1 group">
                  <Button
                    variant={
                      selectedTargetPath === dir.path ? "secondary" : "ghost"
                    }
                    className="flex-1 justify-start h-9 text-sm px-2"
                    onClick={() => setSelectedTargetPath(dir.path)}
                  >
                    <Folder className="mr-2 h-4 w-4 text-blue-500" />
                    <span className="truncate">{dir.name}</span>
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100"
                    onClick={() => fetchContents(dir.path)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {/* ファイル一覧 (ファイルに対してもプレビューを設定する場合) */}
              {files.map((file) => (
                <Button
                  key={file.path}
                  variant={
                    selectedTargetPath === file.path ? "secondary" : "ghost"
                  }
                  className="w-full justify-start h-9 text-sm px-2"
                  onClick={() => setSelectedTargetPath(file.path)}
                >
                  <FileBox className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{file.name}</span>
                </Button>
              ))}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 border-t pt-4 items-center">
          <div className="text-[10px] text-muted-foreground truncate w-full">
            {selectedTargetPath && (
              <span className="truncate" title={selectedTargetPath}>
                設定先: {path.basename(selectedTargetPath) || "/"}
              </span>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              キャンセル
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!selectedTargetPath || isLoading}
            >
              {isSaving ? (
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
