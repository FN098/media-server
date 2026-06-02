import { useCallback, useState } from "react";

export function useSlideshow() {
  const [enabled, setEnabled] = useState(false);
  const [delay, setDelay] = useState(5000);

  const start = useCallback(({ delay = 5000 }: { delay?: number }) => {
    setEnabled(true);
    setDelay(delay);
  }, []);

  const stop = useCallback(() => {
    setEnabled(false);
  }, []);

  const toggle = useCallback(() => {
    setEnabled((prev) => !prev);
  }, []);

  return { enabled, delay, start, stop, toggle };
}
