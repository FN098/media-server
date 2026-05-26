import { TagEditMode } from "@/components/ui/sheets/tag-edit-sheet/types";
import { useTagEditorContext } from "@/providers/tag-editor-provider";
import { useCallback, useMemo } from "react";

type UseTagEditorHandlersProps = {
  isViewerMode: boolean;
};

export function useTagEditorControl({
  isViewerMode,
}: UseTagEditorHandlersProps) {
  const mode = useMemo<TagEditMode>(() => {
    if (isViewerMode) return "single";
    return "default";
  }, [isViewerMode]);

  const { isTagEditMode: isOpen, setIsTagEditMode: setIsOpen } =
    useTagEditorContext();

  const open = useCallback(() => {
    setIsOpen(true);
  }, [setIsOpen]);

  const close = useCallback(() => {
    setIsOpen(false);
  }, [setIsOpen]);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, [setIsOpen]);

  return {
    mode,
    isOpen,
    open,
    close,
    toggle,
  };
}
