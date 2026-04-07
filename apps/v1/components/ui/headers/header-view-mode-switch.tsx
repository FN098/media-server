"use client";
import { ViewModeSwitch } from "@/components/ui/buttons/view-mode-switch";
import { useViewModeContext } from "@/providers/view-mode-provider";

export function HeaderViewModeSwitch() {
  const { viewMode, setViewMode } = useViewModeContext();

  return (
    <ViewModeSwitch
      viewMode={viewMode}
      setViewMode={setViewMode}
      className="shrink-0"
    />
  );
}
