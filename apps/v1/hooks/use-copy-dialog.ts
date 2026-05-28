import { useCallback, useState } from "react";

type CopyDialogContext<T> =
  | {
      isOpen: true;
      initialDir: string;
      targets: T[];
    }
  | { isOpen: false };

interface UseCopyDialogProps<T> {
  onChange?: (context: CopyDialogContext<T>) => void;
}

export function useCopyDialog<T>({ onChange }: UseCopyDialogProps<T> = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [targets, setTargets] = useState<T[]>([]);

  const open = useCallback(
    (targets: T[], initialDir: string) => {
      onChange?.({
        isOpen: true,
        initialDir,
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
