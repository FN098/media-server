import { useCallback, useState } from "react";

type UseDeleteDialogProps<T> = {
  onSelectionChange: (nodes: T[]) => void;
};

export function useDeleteDialog<T>({
  onSelectionChange,
}: UseDeleteDialogProps<T>) {
  const [targets, setTargets] = useState<T[]>([]);

  const isOpen = targets.length > 0;

  const open = useCallback(
    (node: T) => {
      const targets = [node];

      onSelectionChange(targets);
      setTargets(targets);
    },
    [onSelectionChange]
  );

  const openTargets = useCallback(
    (targets: T[]) => {
      onSelectionChange(targets);
      setTargets(targets);
    },
    [onSelectionChange]
  );

  const close = useCallback(() => {
    setTargets([]);
    onSelectionChange([]);
  }, [onSelectionChange]);

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
    openTargets,
    close,
    onOpenChange,
  };
}
