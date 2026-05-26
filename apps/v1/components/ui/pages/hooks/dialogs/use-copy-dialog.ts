import { MediaNode } from "@/lib/media/types";
import { dirname } from "path";
import { useCallback, useMemo, useState } from "react";

type UseCopyDialogProps = {
  selectedNodes: MediaNode[];
  onClose?: () => void;
};

export function useCopyDialog({ selectedNodes, onClose }: UseCopyDialogProps) {
  const [copyTargets, setCopyTargets] = useState<MediaNode[]>([]);

  const isCopyMode = copyTargets.length > 0;

  const initialCopyDialogDirPath = useMemo(
    () => (copyTargets.length > 0 ? dirname(copyTargets[0].path) : undefined),
    [copyTargets]
  );

  const handleOpenCopyDialogSingle = useCallback((node: MediaNode) => {
    setCopyTargets([node]);
  }, []);

  const handleOpenCopyDialogSelected = useCallback(() => {
    setCopyTargets(selectedNodes);
  }, [selectedNodes]);

  const handleCopyDialogOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        setCopyTargets([]);
        onClose?.();
      }
    },
    [onClose]
  );

  return {
    copyTargets,
    setCopyTargets,
    isCopyMode,
    initialCopyDialogDirPath,
    handleOpenCopyDialogSingle,
    handleOpenCopyDialogSelected,
    handleCopyDialogOpenChange,
  };
}
