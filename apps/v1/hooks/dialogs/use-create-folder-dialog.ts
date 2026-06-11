import { createFolderAction } from "@/actions/folders/create";
import { useCallback, useState } from "react";
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
  const [isPending, setIsPending] = useState(false);

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
  const performCreate = useCallback(async () => {
    const trimmedName = folderName.trim();

    if (!trimmedName) {
      toast.error("フォルダ名を入力してください");
      return;
    }

    setIsPending(true);
    const result = await createFolderAction(parentPath, trimmedName);
    setIsPending(false);

    if (result.success) {
      toast.success("フォルダを作成しました");
      onSuccess?.();
      close();
    } else {
      toast.error(result.message);
    }
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
