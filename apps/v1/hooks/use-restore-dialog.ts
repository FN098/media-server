import { useCallback, useState } from "react";

export type RestoreDialogContext<T> =
  | {
      isOpen: true;
      targets: T[];
    }
  | { isOpen: false };

interface UseRestoreDialogProps<T> {
  onChange?: (context: RestoreDialogContext<T>) => void;
}

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

  return {
    targets,
    isOpen,
    open,
    close,
  };
}
