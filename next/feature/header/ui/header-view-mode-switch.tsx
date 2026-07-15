"use client";
import { ViewModeSwitch } from "@/feature/header/ui/view-mode-switch";
import { useViewMode } from "@/feature/view/hooks/use-view-mode";

export function HeaderViewModeSwitch() {
  const { value, apply } = useViewMode();

  return (
    <ViewModeSwitch viewMode={value} setViewMode={apply} className="shrink-0" />
  );
}
