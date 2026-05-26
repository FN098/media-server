import { MediaNode } from "@/lib/media/types";
import { dirname } from "path";
import { useCallback, useMemo, useState } from "react";

type UseMoveDialogProps = {
  selectedNodes: MediaNode[];
  onClose?: () => void;
};

export function useMoveDialog({ selectedNodes, onClose }: UseMoveDialogProps) {
  const [moveTargets, setMoveTargets] = useState<MediaNode[]>([]);

  const isMoveMode = moveTargets.length > 0;

  const initialMoveDialogDirPath = useMemo(
    () => (moveTargets.length > 0 ? dirname(moveTargets[0].path) : undefined),
    [moveTargets]
  );

  const handleOpenMoveDialogSingle = useCallback((node: MediaNode) => {
    setMoveTargets([node]);
  }, []);

  const handleOpenMoveDialogSelected = useCallback(() => {
    setMoveTargets(selectedNodes);
  }, [selectedNodes]);

  const handleMoveDialogOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        setMoveTargets([]);
        onClose?.();
      }
    },
    [onClose]
  );

  return {
    moveTargets,
    setMoveTargets,
    isMoveMode,
    initialMoveDialogDirPath,
    handleOpenMoveDialogSingle,
    handleOpenMoveDialogSelected,
    handleMoveDialogOpenChange,
  };
}
