import { useCallback, useEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

type Option = {
  delay?: number;
};

export function useShowUI({ delay = 3000 }: Option) {
  const [showUI, setShowUI] = useState(true);
  const isHoveringRef = useRef(false); // ホバー状態を保持（レンダリングをトリガーしない）

  const debouncedHideUI = useDebouncedCallback(() => {
    // ホバー中でなければ非表示にする
    if (!isHoveringRef.current) {
      setShowUI(false);
    }
  }, delay);

  const handleInteraction = useCallback(() => {
    setShowUI(true);
    debouncedHideUI();
  }, [debouncedHideUI]);

  // マウスが入った時：表示を維持し、タイマーをキャンセル
  const onMouseEnter = useCallback(() => {
    isHoveringRef.current = true;
    setShowUI(true);
    debouncedHideUI.cancel();
  }, [debouncedHideUI]);

  // マウスが離れた時：タイマーを再開
  const onMouseLeave = useCallback(() => {
    isHoveringRef.current = false;
    debouncedHideUI();
  }, [debouncedHideUI]);

  useEffect(() => {
    debouncedHideUI();
    return () => debouncedHideUI.cancel();
  }, [debouncedHideUI]);

  return {
    showUI,
    setShowUI,
    handleInteraction,
    onMouseEnter,
    onMouseLeave,
  };
}
