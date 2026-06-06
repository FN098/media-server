import { createFolderAction } from "@/actions/folder-actions";
import { useCallback, useState, useTransition } from "react";
import { toast } from "sonner";

interface UseCreateFolderDialogProps {
  onSuccess?: () => void;
}

export function useCreateFolderDialog({
  onSuccess,
}: UseCreateFolderDialogProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [parentPath, setParentPath] = useState<string>("");
  const [folderName, setFolderName] = useState<string>("");

  const [isPending, startTransition] = useTransition();

  // 1. ダイアログを開く
  const open = useCallback((parentPath: string) => {
    setParentPath(parentPath);
    setFolderName(""); // 開くときに入力をクリア
    setIsOpen(true);
  }, []);

  // 2. ダイアログを閉じる
  const close = useCallback(() => {
    setIsOpen(false);
    setParentPath("");
    setFolderName("");
  }, []);

  // 3. フォルダ作成実行
  const performCreate = useCallback(() => {
    const trimmedName = folderName.trim();

    if (!trimmedName) {
      toast.error("フォルダ名を入力してください");
      return;
    }

    startTransition(async () => {
      const result = await createFolderAction(parentPath, trimmedName);

      if (result.success) {
        toast.success("フォルダを作成しました");
        onSuccess?.();
        close();
      } else {
        toast.error(result.error || "作成に失敗しました");
      }
    });
  }, [parentPath, folderName, close, onSuccess]);

  return {
    isOpen,
    parentPath,
    folderName,
    isPending,
    setFolderName,
    open,
    close,
    performCreate,
  };
}
