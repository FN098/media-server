import { useCallback, useState } from "react";

type RestoreDialogContext<T> =
  | {
      isOpen: true;
      targets: T[];
    }
  | { isOpen: false };

type UseRestoreDialogProps<T> = {
  onChange?: (context: RestoreDialogContext<T>) => void;
};

export function useRestoreDialog<T>({
  onChange,
}: UseRestoreDialogProps<T> = {}) {
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
