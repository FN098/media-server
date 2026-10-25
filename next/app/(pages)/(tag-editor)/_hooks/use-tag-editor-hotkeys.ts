import { EditingMode } from "@/lib/tag-editor/types";
import { useHotkeys } from "react-hotkeys-hook";

interface UseTagEditorHotkeysProps {
  isOpen: boolean;
  handleModeChangeDown: () => void;
  handleModeChange: (mode: EditingMode) => void;
  toggleOpacity: () => void;
}

export function useTagEditorHotkeys({
  isOpen,
  handleModeChangeDown,
  handleModeChange,
  toggleOpacity,
}: UseTagEditorHotkeysProps) {
  // Escape / Backspace: 閉じる
  useHotkeys(["escape", "backspace"], () => handleModeChangeDown(), {
    scopes: "tag-editor",
    enabled: isOpen,
  });

  // E: 詳細モード
  useHotkeys("e", () => handleModeChange("edit"), {
    scopes: "tag-editor",
    enabled: isOpen,
  });

  // Q: クイックモード
  useHotkeys("q", () => handleModeChange("quick"), {
    scopes: "tag-editor",
    enabled: isOpen,
  });

  // V: 閲覧モード
  useHotkeys("v", () => handleModeChange("view"), {
    scopes: "tag-editor",
    enabled: isOpen,
  });

  // B: 不透明度トグル
  useHotkeys("b", () => toggleOpacity(), {
    scopes: "tag-editor",
    enabled: isOpen,
  });
}
