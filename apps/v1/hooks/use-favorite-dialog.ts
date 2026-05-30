import { MediaNode } from "@/lib/media/types";
import { useFavoritesContext } from "@/providers/favorites-provider";
import { useCallback, useState, useTransition } from "react";
import { toast } from "sonner";

export type FavoriteDialogMode = "add" | "remove";

interface UseFavoriteDialogProps {
  onSuccess?: () => void;
}

export function useFavoriteDialog({ onSuccess }: UseFavoriteDialogProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [targets, setTargets] = useState<MediaNode[]>([]);
  const [mode, setMode] = useState<FavoriteDialogMode>("add");

  const [isPending, startTransition] = useTransition();
  const { updateMultipleFavorites, deleteMultipleFavorites } =
    useFavoritesContext();

  // 1. ダイアログを開く
  const open = useCallback(
    (nodes: MediaNode[], currentMode: FavoriteDialogMode) => {
      setTargets(nodes);
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
  const performFavoriteAction = useCallback(() => {
    if (targets.length === 0) return;

    const paths = targets.map((n) => n.path);

    startTransition(async () => {
      const result =
        mode === "add"
          ? await updateMultipleFavorites({
              paths,
              skipIfAlreadyFavorite: true,
            })
          : await deleteMultipleFavorites(paths);

      if (result.success) {
        toast.success(
          mode === "add"
            ? "お気に入りが更新されました。"
            : "お気に入りが解除されました。"
        );
        onSuccess?.();
        close();
      } else {
        toast.error(result.error || "処理に失敗しました");
      }
    });
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
