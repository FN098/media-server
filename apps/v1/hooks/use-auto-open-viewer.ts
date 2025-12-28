import { useSearchParams } from "next/navigation";
import { useLayoutEffect, useRef } from "react";

export function useAutoOpenViewer(
  mediaCount: number,
  onOpen: (index: number) => void
) {
  const searchParams = useSearchParams();
  const autoMode = searchParams.get("auto");

  const consumedRef = useRef(false);

  useLayoutEffect(() => {
    if (!autoMode) return;
    if (mediaCount === 0) return;
    if (consumedRef.current) return;

    consumedRef.current = true;

    const targetIndex = autoMode === "last" ? mediaCount - 1 : 0;
    onOpen(targetIndex);
  }, [autoMode, mediaCount, onOpen]);
}
