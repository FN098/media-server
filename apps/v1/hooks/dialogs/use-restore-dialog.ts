import { restoreNodesAction } from "@/actions/media-actions";
import { useCallback, useState, useTransition } from "react";
import { toast } from "sonner";

type RestoreTarget = {
  path: string;
};

interface UseRestoreDialogProps {
  onSuccess?: () => void;
}

export function useRestoreDialog({ onSuccess }: UseRestoreDialogProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [targets, setTargets] = useState<RestoreTarget[]>([]);
  const [isPending, startTransition] = useTransition();

  // 1. ダイアログを開く
  const open = useCallback((targets: RestoreTarget[]) => {
    setTargets(targets);
    setIsOpen(true);
  }, []);

  // 2. ダイアログを閉じる
  const close = useCallback(() => {
    setIsOpen(false);
    setTargets([]);
  }, []);

  // 3. 復元処理の実行
  const performRestore = useCallback(() => {
    if (targets.length === 0) return;

    const paths = targets.map((n) => n.path);

    startTransition(async () => {
      const result = await restoreNodesAction(paths);

      if (result.failed === 0) {
        toast.success(`${result.success}件のアイテムを復元しました`);
        onSuccess?.();
        close();
      } else {
        toast.error(`${result.failed}件の復元に失敗しました`);
      }
    });
  }, [targets, close, onSuccess]);

  return {
    isOpen,
    targets,
    isPending,
    open,
    close,
    performRestore,
  };
}
