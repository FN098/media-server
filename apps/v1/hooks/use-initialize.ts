import { useLayoutEffect, useRef } from "react";

export function useInitialize(callback: () => void) {
  const initialized = useRef(false);

  useLayoutEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    callback();
  }, [callback]);
}
