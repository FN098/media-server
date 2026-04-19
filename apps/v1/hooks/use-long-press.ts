"use client";

import { useCallback, useRef, useState } from "react";

interface Options {
  callback?: () => void;
  ms?: number; // default: 500
}

export function useLongPress(options?: Options) {
  const { callback = null, ms = 500 } = options ?? {};

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [isLongPressed, setIsLongPressed] = useState(false);

  const start = useCallback(() => {
    setIsLongPressed(false);
    timerRef.current = setTimeout(() => {
      callback?.();
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
