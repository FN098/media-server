import { listSubDirectoriesAction } from "@/actions/folder/list-sub";
import { listMediaAction } from "@/actions/node-actions";
import { updatePreviewAction } from "@/actions/preview/update";
import { dirname } from "path";
import { useCallback, useState } from "react";
import { toast } from "sonner";

type PreviewItemInfo = {
  name: string;
  path: string;
};

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
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, setIsPending] = useState(false);

  // 1. 指定ディレクトリのコンテンツ（フォルダ＆ファイル）を同時取得
  const fetchContents = useCallback(async (dirPath: string) => {
    setIsLoading(true);
    const [dirRes, fileRes] = await Promise.all([
      listSubDirectoriesAction(dirPath),
      listMediaAction(dirPath),
    ]);
    setIsLoading(false);

    if (dirRes.success && fileRes.success) {
      setDirs(dirRes.directories || []);
      setFiles(fileRes.files || []);
      setCurrentDir(dirPath);
      setSelectedTargetPath(dirPath); // 階層移動時、デフォルトでそのフォルダを設定先に
    } else {
      toast.error("コンテンツの取得に失敗しました");
    }
  }, []);

  // 2. ダイアログを開く
  const open = useCallback(
    (targetPreviewPath: string) => {
      setPreviewPath(targetPreviewPath);
      setIsOpen(true);

      // 開いたアセットがある親階層からブラウズを開始する
      const initialDir = dirname(targetPreviewPath).replace(/\\/g, "/") || "/";
      void fetchContents(initialDir);
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
    const path = parent === "." ? "" : parent;
    void fetchContents(path);
  }, [currentDir, fetchContents]);

  // 5. プレビュー画像設定の保存実行
  const performSave = useCallback(async () => {
    if (!previewPath || !selectedTargetPath) return;

    setIsPending(true);
    const result = await updatePreviewAction(selectedTargetPath, previewPath);
    setIsPending(false);

    if (result.success) {
      toast.success("プレビューを設定しました");
      onSuccess?.();
      close();
    } else {
      toast.error(result.error || "設定に失敗しました");
    }
  }, [previewPath, selectedTargetPath, close, onSuccess]);

  return {
    isOpen,
    previewPath,
    currentDir,
    dirs,
    files,
    selectedTargetPath,
    isLoading,
    isPending,
    setSelectedTargetPath,
    open,
    close,
    fetchContents,
    goBackParent,
    performSave,
  };
}
