import { renameNodeAction } from "@/actions/node/rename";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type RenameTarget = {
  isDirectory: boolean;
  path: string;
  name: string;
};

interface UseRenameDialogProps {
  onSuccess?: (data: { prevPath: string; nextPath: string }) => void;
}

export function useRenameDialog({ onSuccess }: UseRenameDialogProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [target, setTarget] = useState<RenameTarget | null>(null);
  const [newName, setNewName] = useState<string>("");
  const [extension, setExtension] = useState<string>("");
  const [isPending, setIsPending] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // isPending が解除されたときに、ダイアログが開いていれば再フォーカスする
  useEffect(() => {
    if (!isPending && isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isPending, isOpen]);

  // ダイアログを開く
  const open = useCallback((target: RenameTarget) => {
    setTarget(target);
    setIsOpen(true);

    const isDirectory = target.isDirectory;
    const currentName = target.name;

    // 名前と拡張子の分離
    if (isDirectory) {
      setNewName(currentName);
      setExtension("");
    } else {
      const dotIndex = currentName.lastIndexOf(".");
      const baseName =
        dotIndex > 0 ? currentName.substring(0, dotIndex) : currentName;
      const ext = dotIndex > 0 ? currentName.substring(dotIndex) : "";
      setNewName(baseName);
      setExtension(ext);
    }
  }, []);

  // ダイアログを閉じる
  const close = useCallback(() => {
    setIsOpen(false);
    setTarget(null);
    setNewName("");
    setExtension("");
  }, []);

  // リネーム実行
  const performRename = useCallback(async () => {
    if (!target) return;

    const trimmedName = newName.trim();
    if (!trimmedName) {
      toast.error("名前を入力してください");
      return;
    }

    const fullNewName = `${trimmedName}${extension}`;

    // 名前が変わっていない場合はそのまま閉じる
    if (fullNewName === target.name) {
      close();
      return;
    }

    setIsPending(true);
    try {
      const result = await renameNodeAction({
        sourcePath: target.path,
        newName: fullNewName,
      });
      if (result.success) {
        toast.success("リネームしました");
        onSuccess?.({
          prevPath: result.from,
          nextPath: result.to,
        });
        close();
      } else if (result.hasConflictName) {
        const suggested = getSuggestedName(trimmedName); // (1)を付ける
        setNewName(suggested);
        toast.error(
          "同名のファイルまたはフォルダが存在します。名前を確認してください"
        );
      } else {
        toast.error(result.message || "リネームに失敗しました");
      }
    } finally {
      setIsPending(false);
    }
  }, [target, newName, extension, close, onSuccess]);

  return {
    isOpen,
    target,
    newName,
    extension,
    isPending,
    inputRef,
    setNewName,
    open,
    close,
    performRename,
  };
}

function getSuggestedName(baseName: string): string {
  // すでに (N) が付いていたらNをインクリメント
  const match = baseName.match(/^(.*)\s\((\d+)\)$/);
  if (match) {
    return `${match[1]} (${Number(match[2]) + 1})`;
  }
  return `${baseName} (2)`;
}
