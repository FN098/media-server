import { useCallback, useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

type Option = {
  duration?: number;
  disabled?: boolean;
};

export function useAutoHidingUI({ duration = 3000, disabled = false }: Option) {
  const [isVisible, setIsVisible] = useState(true);

  // 非表示処理をデバウンス
  const hide = useDebouncedCallback(() => {
    if (!disabled) {
      setIsVisible(false);
    }
  }, duration);

  // ユーザーの動きがあった時に呼ぶ関数
  const interact = useCallback(() => {
    setIsVisible(true);
    hide();
  }, [hide]);

  // 手動で切り替える関数
  const toggle = useCallback(() => {
    setIsVisible((prev) => {
      const next = !prev;
      if (next)
        hide(); // 表示されたならタイマー開始
      else hide.cancel(); // 消したならタイマー停止
      return next;
    });
  }, [hide]);

  // 初期ロード時：マウントから指定時間後に隠す
  useEffect(() => {
    hide();
    return () => hide.cancel();
  }, [hide, isVisible]);

  return {
    isVisible,
    show: interact,
    hide,
    toggle,
    interact,
  };
}
