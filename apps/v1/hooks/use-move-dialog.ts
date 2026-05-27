import { useCallback, useState } from "react";

type MoveDialogContext<T> =
  | {
      isOpen: true;
      initialDir: string;
      targets: T[];
    }
  | { isOpen: false };

interface UseMoveDialogProps<T> {
  onChange?: (context: MoveDialogContext<T>) => void;
}

export function useMoveDialog<T>({ onChange }: UseMoveDialogProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialDir, setInitialDir] = useState<string>("");
  const [targets, setTargets] = useState<T[]>([]);

  const open = useCallback(
    (targets: T[], initialDir: string) => {
      onChange?.({
        isOpen: true,
        initialDir,
        targets,
      });
      setTargets(targets);
      setInitialDir(initialDir);
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
    initialDir,
    targets,
    isOpen,
    open,
    onOpenChange,
  };
}
