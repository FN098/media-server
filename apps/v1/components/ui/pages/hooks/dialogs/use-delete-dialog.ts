import { MediaNode } from "@/lib/media/types";
import { useCallback, useState } from "react";

type UseDeleteDialogProps = {
  selectedNodes: MediaNode[];
  onClose?: () => void;
};

export function useDeleteDialog({
  selectedNodes,
  onClose,
}: UseDeleteDialogProps) {
  const [deleteTargets, setDeleteTargets] = useState<MediaNode[]>([]);

  const isDeleteMode = deleteTargets.length > 0;

  const handleOpenDeleteDialogSingle = useCallback((node: MediaNode) => {
    setDeleteTargets([node]);
  }, []);

  const handleOpenDeleteDialogSelected = useCallback(() => {
    setDeleteTargets(selectedNodes);
  }, [selectedNodes]);

  const handleDeleteDialogOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        setDeleteTargets([]);
        onClose?.();
      }
    },
    [onClose]
  );

  return {
    deleteTargets,
    setDeleteTargets,
    isDeleteMode,
    handleOpenDeleteDialogSingle,
    handleOpenDeleteDialogSelected,
    handleDeleteDialogOpenChange,
  };
}
