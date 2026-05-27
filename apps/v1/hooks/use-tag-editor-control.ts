import { TagEditMode } from "@/components/ui/sheets/tag-edit-sheet/types";
import { useTagEditorContext } from "@/providers/tag-editor-provider";
import { useCallback } from "react";

type UseTagEditorHandlersProps = {
  targetCount: number;
};

export function useTagEditorControl({
  targetCount,
}: UseTagEditorHandlersProps) {
  const mode: TagEditMode = targetCount == 1 ? "single" : "default";

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
