import { deleteNodesAction } from "@/actions/node/delete";
import { deleteManyNodesPermanentlyAction } from "@/actions/node/delete-many-permanently";
import { useCallback, useState } from "react";
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
  const [isPending, setIsPending] = useState(false);

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
  const performDelete = useCallback(async () => {
    if (targets.length === 0) return;

    const paths = targets.map((n) => n.path);

    setIsPending(true);
    const result = permanent
      ? await deleteManyNodesPermanentlyAction({ sourcePaths: paths })
      : await deleteNodesAction(paths);
    setIsPending(false);

    if (result.success) {
      if (result.completed.length > 0) {
        toast.success(
          permanent
            ? `${result.completed.length} 件のアイテムを完全に削除しました`
            : `${result.completed.length} 件のアイテムをゴミ箱に移動しました`
        );
      }
      if (result.failed.length > 0) {
        toast.success(
          `${result.failed.length} 件のアイテムの削除に失敗しました`
        );
      }
      if (result.skipped.length > 0) {
        toast.success(
          `${result.skipped.length} 件のアイテムの削除をスキップしました`
        );
      }
      onSuccess?.();
      close();
    } else {
      toast.error(result.message);
    }
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
