import { useCallback, useState } from "react";

export function useHeaderPinned() {
  const [enabled, setEnabled] = useState(false);

  const apply = useCallback((enabled: boolean) => setEnabled(enabled), []);

  const reset = useCallback(() => setEnabled(false), []);

  const toggle = useCallback(() => setEnabled((prev) => !prev), []);

  return {
    enabled,
    apply,
    reset,
    toggle,
  };
}
