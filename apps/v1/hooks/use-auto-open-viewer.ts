import { useSearchParams } from "next/navigation";
import { useLayoutEffect, useRef } from "react";

export function useAutoOpenViewer(
  mediaCount: number,
  onOpen: (index: number) => void
) {
  const searchParams = useSearchParams();
  const auto = searchParams.get("auto");
  const consumedRef = useRef(false);

  useLayoutEffect(() => {
    if (!auto) return;
    if (mediaCount === 0) return;
    if (consumedRef.current) return;

    consumedRef.current = true;

    const targetIndex = auto === "last" ? mediaCount - 1 : 0;
    onOpen(targetIndex);
  }, [auto, mediaCount, onOpen]);
}
