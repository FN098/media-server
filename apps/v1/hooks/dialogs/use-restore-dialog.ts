import { restoreNodesAction } from "@/actions/node-actions";
import { useCallback, useState } from "react";
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
  const [isPending, setIsPending] = useState(false);

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
  const performRestore = useCallback(async () => {
    if (targets.length === 0) return;

    const paths = targets.map((n) => n.path);

    setIsPending(true);
    const result = await restoreNodesAction(paths);
    setIsPending(false);

    if (result.success) {
      if (result.completed.length > 0) {
        toast.success(`${result.completed.length} 件のアイテムを復元しました`);
      }
      if (result.failed.length > 0) {
        toast.success(
          `${result.failed.length} 件のアイテムの復元に失敗しました`
        );
      }
      if (result.skipped.length > 0) {
        toast.success(
          `${result.skipped.length} 件のアイテムの復元をスキップしました`
        );
      }
      onSuccess?.();
      close();
    } else {
      toast.error(result.message);
    }
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
