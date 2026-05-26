import { MediaNode } from "@/lib/media/types";
import { useCallback, useState } from "react";

type UsePreviewDialogProps = {
  onClose?: () => void;
};

export function usePreviewDialog({ onClose }: UsePreviewDialogProps) {
  const [previewPath, setPreviewPath] = useState<string | null>(null);

  const isFolderPreviewMode = previewPath != null;

  const handleOpenApplyPreviewDialog = useCallback((node: MediaNode) => {
    setPreviewPath(node.path);
  }, []);

  const handleApplyPreviewDialogOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        setPreviewPath(null);
        onClose?.();
      }
    },
    [onClose]
  );

  return {
    previewPath,
    setPreviewPath,
    isFolderPreviewMode,
    handleOpenApplyPreviewDialog,
    handleApplyPreviewDialogOpenChange,
  };
}
