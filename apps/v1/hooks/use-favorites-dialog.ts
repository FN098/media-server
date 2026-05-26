import { FavoriteDialogMode } from "@/components/ui/dialogs/favorite-dialog";
import { useCallback, useState } from "react";

type UseFavoriteDialogProps<T> = {
  selectedNodes: T[];
};

export function useFavoriteDialog<T>({
  selectedNodes,
}: UseFavoriteDialogProps<T>) {
  const [targets, setTargets] = useState<T[]>([]);

  const [mode, setMode] = useState<FavoriteDialogMode>("add");

  const isOpen = targets.length > 0;

  const openSelected = useCallback(
    ({ mode }: { mode: FavoriteDialogMode }) => {
      setTargets(selectedNodes);
      setMode(mode);
    },
    [selectedNodes]
  );

  const onOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setTargets([]);
    }
  }, []);

  return {
    targets,
    setTargets,
    mode,
    setMode,
    isOpen,
    openSelected,
    onOpenChange,
  };
}
