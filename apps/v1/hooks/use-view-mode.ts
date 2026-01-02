import { ViewMode } from "@/lib/view/types";
import { useMemo, useState } from "react";

export function useViewMode(initialViewMode: ViewMode = "grid") {
  const [viewMode, setViewMode] = useState(initialViewMode);

  return useMemo(
    () => ({
      viewMode,
      setViewMode,
    }),
    [viewMode]
  );
}
