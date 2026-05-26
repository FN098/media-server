import { MediaNode } from "@/lib/media/types";
import { useCallback, useState } from "react";

type UseExtractDialogProps = {
  selectedNodes: MediaNode[];
  onClose?: () => void;
};

export function useExtractDialog({
  selectedNodes,
  onClose,
}: UseExtractDialogProps) {
  const [extractTargets, setExtractTargets] = useState<MediaNode[]>([]);

  const isExtractMode = extractTargets.length > 0;

  const handleOpenExtractDialogSingle = useCallback((node: MediaNode) => {
    setExtractTargets([node]);
  }, []);

  const handleOpenExtractDialogSelected = useCallback(() => {
    setExtractTargets(selectedNodes);
  }, [selectedNodes]);

  const handleExtractDialogOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        setExtractTargets([]);
        onClose?.();
      }
    },
    [onClose]
  );

  return {
    extractTargets,
    setExtractTargets,
    isExtractMode,
    handleOpenExtractDialogSingle,
    handleOpenExtractDialogSelected,
    handleExtractDialogOpenChange,
  };
}
