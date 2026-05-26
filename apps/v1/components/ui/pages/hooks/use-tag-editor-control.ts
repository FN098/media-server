import { TagEditMode } from "@/components/ui/sheets/tag-edit-sheet/types";
import { useTagEditorContext } from "@/providers/tag-editor-provider";
import { useCallback, useMemo } from "react";

type UseTagEditorControlProps = {
  isViewerMode: boolean;
};

export function useTagEditorControl({
  isViewerMode,
}: UseTagEditorControlProps) {
  const { isTagEditMode, setIsTagEditMode } = useTagEditorContext();

  const tagEditMode = useMemo<TagEditMode>(() => {
    if (isViewerMode) return "single";
    return "default";
  }, [isViewerMode]);

  const handleOpenTagEditor = useCallback(() => {
    setIsTagEditMode(true);
  }, [setIsTagEditMode]);

  const handleCloseTagEditor = useCallback(() => {
    setIsTagEditMode(false);
  }, [setIsTagEditMode]);

  const handleToggleTagEditMode = useCallback(() => {
    setIsTagEditMode((prev) => !prev);
  }, [setIsTagEditMode]);

  return {
    isTagEditMode,
    tagEditMode,
    handleOpenTagEditor,
    handleCloseTagEditor,
    handleToggleTagEditMode,
  };
}
