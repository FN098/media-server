import { useCallback, useState } from "react";

export function useRenameDialog<T>() {
  const [target, setTarget] = useState<T | null>(null);

  const isOpen = !!target;

  const open = useCallback((node: T) => {
    setTarget(node);
  }, []);

  const onOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setTarget(null);
    }
  }, []);

  return {
    target,
    setTarget,
    isOpen,
    open,
    onOpenChange,
  };
}
