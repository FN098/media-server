import { useCallback, useState } from "react";

type UseMoveDialogProps<T> = {
  initialDir: string;
  selectedNodes: T[];
  clearSelection: () => void;
};

export function useMoveDialog<T>({
  initialDir,
  selectedNodes,
  clearSelection,
}: UseMoveDialogProps<T>) {
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
    initialDir,
    targets,
    setTargets,
    isOpen,
    open,
    openSelected,
    onOpenChange,
  };
}
