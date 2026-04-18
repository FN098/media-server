"use client";
import { ViewModeSwitch } from "@/components/ui/buttons/view-mode-switch";
import { useViewMode, ViewModeOptions } from "@/hooks/use-view-mode";

export function HeaderViewModeSwitch({
  options,
}: {
  options?: ViewModeOptions;
}) {
  const { value, apply } = useViewMode(options);

  return (
    <ViewModeSwitch viewMode={value} setViewMode={apply} className="shrink-0" />
  );
}
