import { useCallback, useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

type Option = {
  delay?: number;
  disabled?: boolean;
};

export function useShowUI({ delay = 3000, disabled = false }: Option) {
  const [showUI, setShowUI] = useState(true);

  const debouncedHideUI = useDebouncedCallback(() => {
    if (!disabled) {
      setShowUI(false);
    }
  }, delay);

  const handleInteraction = useCallback(() => {
    setShowUI(true);
    debouncedHideUI();
  }, [debouncedHideUI]);

  // 初回レンダリング時
  useEffect(() => {
    debouncedHideUI();
    return () => debouncedHideUI.cancel(); // アンマウント時の掃除
  }, [debouncedHideUI, showUI]);

  return { showUI, setShowUI, handleInteraction };
}
