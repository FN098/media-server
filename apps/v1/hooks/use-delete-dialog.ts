import { useCallback, useState } from "react";

export type DeleteDialogContext<T> =
  | {
      isOpen: true;
      targets: T[];
    }
  | { isOpen: false };

interface UseDeleteDialogProps<T> {
  onChange?: (context: DeleteDialogContext<T>) => void;
}

export function useDeleteDialog<T>({ onChange }: UseDeleteDialogProps<T> = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [targets, setTargets] = useState<T[]>([]);

  const open = useCallback(
    (targets: T[]) => {
      onChange?.({
        isOpen: true,
        targets,
      });
      setTargets(targets);
      setIsOpen(true);
    },
    [onChange]
  );

  const close = useCallback(() => {
    onChange?.({ isOpen: false });
    setTargets([]);
    setIsOpen(false);
  }, [onChange]);

  return {
    targets,
    isOpen,
    open,
    close,
  };
}
