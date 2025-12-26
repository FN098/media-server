import { useEffect } from "react";

export const useScrollLock = (lock: boolean = true) => {
  useEffect(() => {
    if (!lock) return;

    // 元のスタイルを保存
    const originalStyle = window.getComputedStyle(document.body).overflow;

    // スクロールを禁止
    document.body.style.overflow = "hidden";

    // クリーンアップ関数で元に戻す
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [lock]);
};
