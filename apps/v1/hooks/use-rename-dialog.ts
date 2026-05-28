import { useCallback, useState } from "react";

type RenameDialogContext<T> =
  | {
      isOpen: true;
      target: T;
    }
  | { isOpen: false };

type UseRenameDialogProps<T> = {
  onChange?: (context: RenameDialogContext<T>) => void;
};

export function useRenameDialog<T>({ onChange }: UseRenameDialogProps<T> = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [target, setTarget] = useState<T | null>(null);

  const open = useCallback(
    (node: T) => {
      onChange?.({
        isOpen: true,
        target: node,
      });
      setTarget(node);
      setIsOpen(true);
    },
    [onChange]
  );

  const close = useCallback(() => {
    onChange?.({ isOpen: false });
    setTarget(null);
    setIsOpen(false);
  }, [onChange]);

  return { target, isOpen, open, close };
}
