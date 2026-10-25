import { useCallback, useState } from "react";

export function useViewerHeaderPinned() {
  const [isPinned, setIsPinned] = useState(false);

  const apply = useCallback((value: boolean) => setIsPinned(value), []);

  const reset = useCallback(() => setIsPinned(false), []);

  const toggle = useCallback(() => setIsPinned((prev) => !prev), []);

  return {
    isPinned,
    apply,
    reset,
    toggle,
  };
}
