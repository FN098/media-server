"use client";

import { useCallback, useRef, useState } from "react";

export function useLongPress(callback: () => void, ms = 500) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [isLongPressed, setIsLongPressed] = useState(false);

  const start = useCallback(() => {
    setIsLongPressed(false);
    timerRef.current = setTimeout(() => {
      callback();
      setIsLongPressed(true);
      if (window.navigator.vibrate) window.navigator.vibrate(50);
    }, ms);
  }, [callback, ms]);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return { start, stop, isLongPressed };
}
