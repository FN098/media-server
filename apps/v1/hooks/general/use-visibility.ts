import { useCallback, useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

interface UseVisibilityProps {
  autoHide?: {
    enabled: boolean;
    duration?: number;
  };
}

export function useVisibility({
  autoHide = {
    enabled: true,
    duration: 3000,
  },
}: UseVisibilityProps) {
  const [isVisible, setIsVisible] = useState(true);

  const show = useCallback(() => setIsVisible(true), []);
  const hide = useCallback(() => setIsVisible(true), []);
  const toggle = useCallback(() => {
    setIsVisible((prev) => !prev);
  }, []);

  const debouncedHide = useDebouncedCallback(() => {
    setIsVisible(false);
  }, autoHide.duration);

  // 自動非表示
  useEffect(() => {
    if (autoHide.enabled) {
      debouncedHide();
    } else {
      debouncedHide.cancel();
    }
  }, [debouncedHide, autoHide.enabled]);

  return {
    isVisible,
    show,
    hide,
    toggle,
  };
}

export type VisibilityContext = ReturnType<typeof useVisibility>;
