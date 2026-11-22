"use client";

import { ViewModeSwitch } from "@/feature/view-mode/components/view-mode-switch";
import { useViewMode } from "@/feature/view-mode/hooks/use-view-mode";

export function ViewModeSwitchClient() {
  const { value, apply } = useViewMode();

  return (
    <ViewModeSwitch viewMode={value} setViewMode={apply} className="shrink-0" />
  );
}
