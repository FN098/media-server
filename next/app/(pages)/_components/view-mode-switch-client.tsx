"use client";

import { ViewModeSwitch } from "@/app/(pages)/_components/view-mode-switch";
import { useViewMode } from "@/feature/view/hooks/use-view-mode";

export function ViewModeSwitchClient() {
  const { value, apply } = useViewMode();

  return (
    <ViewModeSwitch viewMode={value} setViewMode={apply} className="shrink-0" />
  );
}
