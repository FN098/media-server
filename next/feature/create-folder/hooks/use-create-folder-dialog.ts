import { createFolderAction } from "@/feature/create-folder/actions/create-folder";
import { useCallback, useState } from "react";
import { toast } from "sonner";

interface UseCreateFolderDialogProps {
  onSuccess?: () => void;
}

export function useCreateFolderDialog({
  onSuccess,
}: UseCreateFolderDialogProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [parentFolderId, setParentFolderId] = useState<string>("");
  const [newFolderName, setNewFolderName] = useState<string>("");
  const [isPending, setIsPending] = useState(false);

  // ダイアログを開く
  const open = useCallback((parentPath: string) => {
    setParentFolderId(parentPath);
    setNewFolderName(""); // 開くときに入力をクリア
    setIsOpen(true);
  }, []);

  // ダイアログを閉じる
  const close = useCallback(() => {
    setIsOpen(false);
    setParentFolderId("");
    setNewFolderName("");
  }, []);

  // フォルダ作成実行
  const performCreate = useCallback(async () => {
    const trimmedName = newFolderName.trim();

    if (!trimmedName) {
      toast.error("フォルダ名を入力してください");
      return;
    }

    setIsPending(true);
    try {
      const result = await createFolderAction({
        parentFolderId,
        newFolderName: trimmedName,
      });

      if (result.success) {
        toast.success("フォルダを作成しました");
        onSuccess?.();
        close();
      } else {
        toast.error(result.message);
      }
    } finally {
      setIsPending(false);
    }
  }, [parentFolderId, newFolderName, close, onSuccess]);

  return {
    isOpen,
    open,
    close,
    parentFolderId,
    newFolderName,
    setNewFolderName,
    performCreate,
    isPending,
  };
}
