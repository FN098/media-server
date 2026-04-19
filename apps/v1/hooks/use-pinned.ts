"use client";

import { useCallback, useState } from "react";

export function usePinned() {
  const [pinned, setPinned] = useState(false);

  const apply = useCallback((next: boolean) => setPinned(next), []);
  const reset = useCallback(() => setPinned(false), []);
  const toggle = useCallback(() => setPinned((prev) => !prev), []);

  return {
    value: pinned,
    apply,
    reset,
    toggle,
  };
}
