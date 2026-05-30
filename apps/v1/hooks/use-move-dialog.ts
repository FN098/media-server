import { useCallback, useState } from "react";

type MoveDialogContext<T> =
  | {
      isOpen: true;
      initialDir: string;
      currentDIr: string;
      targets: T[];
    }
  | { isOpen: false };

interface UseMoveDialogProps<T> {
  onChange?: (context: MoveDialogContext<T>) => void;
}

export function useMoveDialog<T>({ onChange }: UseMoveDialogProps<T> = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialDir, setInitialDir] = useState<string>("");
  const [currentDir, setCurrentDir] = useState<string>("");
  const [targets, setTargets] = useState<T[]>([]);

  const open = useCallback(
    (targets: T[], initialDir: string) => {
      onChange?.({
        isOpen: true,
        initialDir,
        currentDIr: initialDir,
        targets,
      });
      setTargets(targets);
      setInitialDir(initialDir);
      setCurrentDir(initialDir);
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
    initialDir,
    currentDir,
    setCurrentDir,
    targets,
    isOpen,
    open,
    close,
  };
}
