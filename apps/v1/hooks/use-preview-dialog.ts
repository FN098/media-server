import { listSubDirectoriesAction } from "@/lib/folder/actions";
import { listMediaAction } from "@/lib/media/actions";
import { updatePreviewAction } from "@/lib/preview/actions";
import { dirname } from "path";
import { useCallback, useState, useTransition } from "react";
import { toast } from "sonner";

export type PreviewItemInfo = { name: string; path: string };

interface UsePreviewDialogProps {
  onSuccess?: () => void;
}

export function usePreviewDialog({ onSuccess }: UsePreviewDialogProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [previewPath, setPreviewPath] = useState<string>("");
  const [currentDir, setCurrentDir] = useState<string>("/");
  const [dirs, setDirs] = useState<PreviewItemInfo[]>([]);
  const [files, setFiles] = useState<PreviewItemInfo[]>([]);
  const [selectedTargetPath, setSelectedTargetPath] = useState<string | null>(
    null
  );

  const [isNavigating, startNavigating] = useTransition();
  const [isSaving, startSaving] = useTransition();
  const isLoading = isNavigating || isSaving;

  // 1. 指定ディレクトリのコンテンツ（フォルダ＆ファイル）を同時取得
  const fetchContents = useCallback((dirPath: string) => {
    startNavigating(async () => {
      const [dirRes, fileRes] = await Promise.all([
        listSubDirectoriesAction(dirPath),
        listMediaAction(dirPath),
      ]);

      if (dirRes.success && fileRes.success) {
        setDirs(dirRes.directories || []);
        setFiles(fileRes.files || []);
        setCurrentDir(dirPath);
        setSelectedTargetPath(dirPath); // 階層移動時、デフォルトでそのフォルダを設定先に
      } else {
        toast.error("コンテンツの取得に失敗しました");
      }
    });
  }, []);

  // 2. ダイアログを開く
  const open = useCallback(
    (targetPreviewPath: string) => {
      setPreviewPath(targetPreviewPath);
      setIsOpen(true);

      // 開いたアセットがある親階層からブラウズを開始する
      const initialDir = dirname(targetPreviewPath).replace(/\\/g, "/") || "/";
      fetchContents(initialDir);
    },
    [fetchContents]
  );

  // 3. ダイアログを閉じる
  const close = useCallback(() => {
    setIsOpen(false);
    setPreviewPath("");
    setCurrentDir("/");
    setDirs([]);
    setFiles([]);
    setSelectedTargetPath(null);
  }, []);

  // 4. 親階層へ戻る
  const goBackParent = useCallback(() => {
    const parent = dirname(currentDir).replace(/\\/g, "/");
    const path = parent === "." ? "/" : parent;
    fetchContents(path);
  }, [currentDir, fetchContents]);

  // 5. プレビュー画像設定の保存実行
  const performSave = useCallback(() => {
    if (!previewPath || !selectedTargetPath) return;

    startSaving(async () => {
      const result = await updatePreviewAction(selectedTargetPath, previewPath);
      if (result.success) {
        toast.success("プレビューを設定しました");
        onSuccess?.();
        close();
      } else {
        toast.error(result.error || "設定に失敗しました");
      }
    });
  }, [previewPath, selectedTargetPath, close, onSuccess]);

  return {
    isOpen,
    previewPath,
    currentDir,
    dirs,
    files,
    selectedTargetPath,
    isLoading,
    isSaving,
    setSelectedTargetPath,
    open,
    close,
    fetchContents,
    goBackParent,
    performSave,
  };
}
