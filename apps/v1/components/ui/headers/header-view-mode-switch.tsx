"use client";
import { ViewModeSwitch } from "@/components/ui/buttons/view-mode-switch";
import { useViewMode } from "@/hooks/view/use-view-mode";

export function HeaderViewModeSwitch() {
  const { value, apply } = useViewMode();

  return (
    <ViewModeSwitch viewMode={value} setViewMode={apply} className="shrink-0" />
  );
}
