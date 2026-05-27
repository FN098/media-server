import { useCallback, useState } from "react";

export function useBoolState(initialValue: boolean = false) {
  const [value, setValue] = useState(initialValue);

  const apply = useCallback((next: boolean) => setValue(next), []);
  const reset = useCallback(() => setValue(false), []);
  const toggle = useCallback(() => setValue((prev) => !prev), []);

  return {
    value,
    setValue,
    apply,
    reset,
    toggle,
  };
}
