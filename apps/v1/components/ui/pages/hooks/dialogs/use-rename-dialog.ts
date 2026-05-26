import { MediaNode } from "@/lib/media/types";
import { useCallback, useState } from "react";

type UseRenameDialogProps = {
  onClose?: () => void;
};

export function useRenameDialog({ onClose }: UseRenameDialogProps) {
  const [renameTarget, setRenameTarget] = useState<MediaNode | null>(null);

  const isRenameMode = !!renameTarget;

  const handleOpenRenameDialog = useCallback((node: MediaNode) => {
    setRenameTarget(node);
  }, []);

  const handleRenameDialogOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        setRenameTarget(null);
        onClose?.();
      }
    },
    [onClose]
  );

  return {
    renameTarget,
    setRenameTarget,
    isRenameMode,
    handleOpenRenameDialog,
    handleRenameDialogOpenChange,
  };
}
