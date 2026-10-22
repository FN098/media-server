import { useFavoritesControlContext } from "@/feature/favorite/providers/favorites-control-provider";
import { useCallback, useState } from "react";
import { toast } from "sonner";

type Item = {
  id: string;
};

type Action = "add" | "remove";

interface UseFavoriteDialogProps {
  onSuccess?: () => void;
}

export function useFavoriteDialog({ onSuccess }: UseFavoriteDialogProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [targets, setTargets] = useState<Item[]>([]);
  const [action, setAction] = useState<Action>("add");
  const [isPending, setIsPending] = useState(false);

  const {
    addManyFavorites: updateMultipleFavorites,
    removeManyFavorites: deleteMultipleFavorites,
  } = useFavoritesControlContext();

  // 1. ダイアログを開く
  const open = useCallback((targets: Item[], currentMode: Action) => {
    setTargets(targets);
    setAction(currentMode);
    setIsOpen(true);
  }, []);

  // 2. ダイアログを閉じる
  const close = useCallback(() => {
    setIsOpen(false);
    setTargets([]);
    setAction("add");
  }, []);

  // 3. お気に入り処理（追加 / 解除）の実行
  const performFavoriteAction = useCallback(async () => {
    if (targets.length === 0) return;

    const paths = targets.map((n) => n.id);

    setIsPending(true);
    const result =
      action === "add"
        ? await updateMultipleFavorites({
            paths,
            skipIfAlreadyFavorite: true,
          })
        : await deleteMultipleFavorites(paths);
    setIsPending(false);

    if (result.success) {
      toast.success(
        action === "add"
          ? "お気に入りが更新されました。"
          : "お気に入りが解除されました。"
      );
      onSuccess?.();
      close();
    } else {
      toast.error(result.message);
    }
  }, [
    targets,
    action,
    updateMultipleFavorites,
    deleteMultipleFavorites,
    close,
    onSuccess,
  ]);

  return {
    isOpen,
    targets,
    action,
    isPending,
    open,
    close,
    performFavoriteAction,
  };
}
