import { useFavoritesControlContext } from "@/providers/favorites-control-provider";
import { useCallback, useState } from "react";
import { toast } from "sonner";

type FavoriteTarget = {
  path: string;
};

type FavoriteDialogMode = "add" | "remove";

interface UseFavoriteDialogProps {
  onSuccess?: () => void;
}

export function useFavoriteDialog({ onSuccess }: UseFavoriteDialogProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [targets, setTargets] = useState<FavoriteTarget[]>([]);
  const [mode, setMode] = useState<FavoriteDialogMode>("add");
  const [isPending, setIsPending] = useState(false);

  const { updateMultipleFavorites, deleteMultipleFavorites } =
    useFavoritesControlContext();

  // 1. ダイアログを開く
  const open = useCallback(
    (targets: FavoriteTarget[], currentMode: FavoriteDialogMode) => {
      setTargets(targets);
      setMode(currentMode);
      setIsOpen(true);
    },
    []
  );

  // 2. ダイアログを閉じる
  const close = useCallback(() => {
    setIsOpen(false);
    setTargets([]);
    setMode("add");
  }, []);

  // 3. お気に入り処理（追加 / 解除）の実行
  const performFavoriteAction = useCallback(async () => {
    if (targets.length === 0) return;

    const paths = targets.map((n) => n.path);

    setIsPending(true);
    const result =
      mode === "add"
        ? await updateMultipleFavorites({
            paths,
            skipIfAlreadyFavorite: true,
          })
        : await deleteMultipleFavorites(paths);
    setIsPending(false);

    if (result.success) {
      toast.success(
        mode === "add"
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
    mode,
    updateMultipleFavorites,
    deleteMultipleFavorites,
    close,
    onSuccess,
  ]);

  return {
    isOpen,
    targets,
    mode,
    isPending,
    open,
    close,
    performFavoriteAction,
  };
}
