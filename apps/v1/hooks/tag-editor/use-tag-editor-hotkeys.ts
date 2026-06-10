import { EditingMode } from "@/components/ui/sheets/tag-edit-sheet/types";
import { useHotkeys } from "react-hotkeys-hook";

interface UseTagEditorHotkeysProps {
  open: boolean;
  handleModeChangeDown: () => void;
  handleModeChange: (mode: EditingMode) => void;
  toggleOpacity: () => void;
}

export function useTagEditorHotkeys({
  open,
  handleModeChangeDown,
  handleModeChange,
  toggleOpacity,
}: UseTagEditorHotkeysProps) {
  // Escape / Backspace: 閉じる
  useHotkeys(["escape", "backspace"], () => handleModeChangeDown(), {
    scopes: "tag-editor",
    enabled: open,
  });

  // E: 詳細モード
  useHotkeys("e", () => handleModeChange("edit"), {
    scopes: "tag-editor",
    enabled: open,
  });

  // Q: クイックモード
  useHotkeys("q", () => handleModeChange("quick"), {
    scopes: "tag-editor",
    enabled: open,
  });

  // V: 閲覧モード
  useHotkeys("v", () => handleModeChange("view"), {
    scopes: "tag-editor",
    enabled: open,
  });

  // B: 不透明度トグル
  useHotkeys("b", () => toggleOpacity(), {
    scopes: "tag-editor",
    enabled: open,
  });
}
