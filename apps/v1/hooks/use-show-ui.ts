import { useCallback, useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

type Option = {
  delay?: number;
};

export function useShowUI({ delay = 3000 }: Option) {
  const [showUI, setShowUI] = useState(true);

  const debouncedHideUI = useDebouncedCallback(() => {
    setShowUI(false);
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
