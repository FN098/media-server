import { useCallback, useState } from "react";

export function usePreviewDialog<T extends { path: string }>() {
  const [previewPath, setPreviewPath] = useState<string | null>(null);

  const isOpen = previewPath != null;

  const open = useCallback((node: T) => {
    setPreviewPath(node.path);
  }, []);

  const onOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setPreviewPath(null);
    }
  }, []);

  return {
    previewPath,
    setPreviewPath,
    isOpen,
    open,
    onOpenChange,
  };
}
