import { FavoriteDialogMode } from "@/components/ui/dialogs/favorite-dialog";
import { useCallback, useState } from "react";

type FavoriteDialogContext<T> =
  | {
      isOpen: true;
      mode: FavoriteDialogMode;
      targets: T[];
    }
  | { isOpen: false };

type UseFavoriteDialogProps<T> = {
  onChange?: (context: FavoriteDialogContext<T>) => void;
};

export function useFavoriteDialog<T>({ onChange }: UseFavoriteDialogProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [targets, setTargets] = useState<T[]>([]);
  const [mode, setMode] = useState<FavoriteDialogMode>("add");

  const open = useCallback(
    (targets: T[], mode: FavoriteDialogMode) => {
      onChange?.({
        isOpen: true,
        mode,
        targets,
      });
      setTargets(targets);
      setMode(mode);
      setIsOpen(true);
    },
    [onChange]
  );

  const close = useCallback(() => {
    onChange?.({ isOpen: false });
    setTargets([]);
    setIsOpen(false);
  }, [onChange]);

  const onOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        close();
      }
    },
    [close]
  );

  return {
    targets,
    mode,
    isOpen,
    open,
    close,
    onOpenChange,
  };
}
