import { useCallback, useState } from "react";

export type HeaderPinned = ReturnType<typeof useHeaderPinned>;

export function useHeaderPinned() {
  const [enabled, setEnabled] = useState(false);

  const apply = useCallback(
    (nextIsPinned: boolean) => setEnabled(nextIsPinned),
    []
  );

  const reset = useCallback(() => setEnabled(false), []);

  const toggle = useCallback(() => setEnabled((prev) => !prev), []);

  return {
    enabled,
    apply,
    reset,
    toggle,
  };
}
