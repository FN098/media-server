import { useCallback, useState } from "react";

export type HeaderPinned = ReturnType<typeof useHeaderPinned>;

export function useHeaderPinned(initialValue: boolean = false) {
  const [isPinned, setIsPinned] = useState(initialValue);

  const apply = useCallback(
    (nextIsPinned: boolean) => setIsPinned(nextIsPinned),
    []
  );

  const reset = useCallback(() => setIsPinned(false), []);

  const toggle = useCallback(() => setIsPinned((prev) => !prev), []);

  return {
    isPinned,
    apply,
    reset,
    toggle,
  };
}
