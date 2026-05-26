import { useCallback, useState } from "react";

type UseDeleteDialogProps<T> = {
  selectedNodes: T[];
  clearSelection: () => void;
};

export function useDeleteDialog<T>({
  selectedNodes,
  clearSelection,
}: UseDeleteDialogProps<T>) {
  const [targets, setTargets] = useState<T[]>([]);

  const isOpen = targets.length > 0;

  const open = useCallback((node: T) => {
    setTargets([node]);
  }, []);

  const openSelected = useCallback(() => {
    setTargets(selectedNodes);
  }, [selectedNodes]);

  const onOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        setTargets([]);
        clearSelection();
      }
    },
    [clearSelection]
  );

  return {
    targets,
    setTargets,
    isOpen,
    open,
    openSelected,
    onOpenChange,
  };
}
