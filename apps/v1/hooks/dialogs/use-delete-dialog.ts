import {
  deleteNodesAction,
  deleteNodesPermanentlyAction,
} from "@/actions/node-actions";
import { useCallback, useState, useTransition } from "react";
import { toast } from "sonner";

type DeleteTarget = {
  path: string;
};

interface UseDeleteDialogProps {
  onSuccess?: () => void;
}

export function useDeleteDialog({ onSuccess }: UseDeleteDialogProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [targets, setTargets] = useState<DeleteTarget[]>([]);
  const [permanent, setPermanent] = useState(false);

  const [isPending, startTransition] = useTransition();

  // 1. ダイアログを開く（完全削除かどうかのフラグをここで受け取る）
  const open = useCallback(
    (nodes: DeleteTarget[], options?: { isPermanent: boolean }) => {
      setTargets(nodes);
      setPermanent(options?.isPermanent ?? false);
      setIsOpen(true);
    },
    []
  );

  // 2. ダイアログを閉じる
  const close = useCallback(() => {
    setIsOpen(false);
    setTargets([]);
    setPermanent(false);
  }, []);

  // 3. 削除処理の実行
  const performDelete = useCallback(() => {
    if (targets.length === 0) return;

    const paths = targets.map((n) => n.path);

    startTransition(async () => {
      const result = permanent
        ? await deleteNodesPermanentlyAction(paths)
        : await deleteNodesAction(paths);

      if (result.failed === 0) {
        toast.success(
          permanent
            ? `${result.success}件のアイテムを完全に削除しました`
            : `${result.success}件をゴミ箱に移動しました`
        );
        onSuccess?.();
        close();
      } else {
        toast.error(`${result.failed}件の削除に失敗しました`);
      }
    });
  }, [targets, permanent, close, onSuccess]);

  return {
    isOpen,
    targets,
    permanent,
    isPending,
    open,
    close,
    performDelete,
  };
}
