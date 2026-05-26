import { TagEditMode } from "@/components/ui/sheets/tag-edit-sheet/types";
import { useTagEditorContext } from "@/providers/tag-editor-provider";
import { useCallback, useMemo } from "react";

type UseTagEditorHandlersProps = {
  isViewerMode: boolean;
};

export function useTagEditorHandlers({
  isViewerMode,
}: UseTagEditorHandlersProps) {
  const {
    isTagEditMode: isTagEditorOpen,
    setIsTagEditMode: setIsTagEditorOpen,
  } = useTagEditorContext();

  const tagEditMode = useMemo<TagEditMode>(() => {
    if (isViewerMode) return "single";
    return "default";
  }, [isViewerMode]);

  const handleOpenTagEditor = useCallback(() => {
    setIsTagEditorOpen(true);
  }, [setIsTagEditorOpen]);

  const handleCloseTagEditor = useCallback(() => {
    setIsTagEditorOpen(false);
  }, [setIsTagEditorOpen]);

  const handleToggleTagEditMode = useCallback(() => {
    setIsTagEditorOpen((prev) => !prev);
  }, [setIsTagEditorOpen]);

  return {
    isTagEditorOpen,
    tagEditMode,
    handleOpenTagEditor,
    handleCloseTagEditor,
    handleToggleTagEditMode,
  };
}
