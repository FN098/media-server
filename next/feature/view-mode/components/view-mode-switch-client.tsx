"use client";

import { useViewMode } from "@/__feature/view/hooks/use-view-mode";
import { ViewModeSwitch } from "@/feature/view-mode/components/view-mode-switch";

export function ViewModeSwitchClient() {
  const { value, apply } = useViewMode();

  return (
    <ViewModeSwitch viewMode={value} setViewMode={apply} className="shrink-0" />
  );
}
