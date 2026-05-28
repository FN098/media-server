import { useCallback, useState } from "react";

export type ExtractDialogContext<T> =
  | {
      isOpen: true;
      targets: T[];
    }
  | { isOpen: false };

interface UseExtractDialogProps<T> {
  onChange?: (context: ExtractDialogContext<T>) => void;
}

export function useExtractDialog<T>({
  onChange,
}: UseExtractDialogProps<T> = {}) {
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
