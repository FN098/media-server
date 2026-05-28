import { useCallback, useState } from "react";

type DeleteDialogContext<T> =
  | {
      isOpen: true;
      targets: T[];
    }
  | { isOpen: false };

type UseDeleteDialogProps<T> = {
  onChange?: (context: DeleteDialogContext<T>) => void;
};

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
    isOpen,
    open,
    close,
    onOpenChange,
  };
}
