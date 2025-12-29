import { useCallback, useRef } from "react";

export const useScrollLockControl = () => {
  // 元のスタイルを保存しておくためのRef
  const originalStyle = useRef<string>("");

  // ロックする関数
  const lock = useCallback(() => {
    if (typeof window === "undefined") return;

    // すでにロックされている場合は二重に保存しない
    if (document.body.style.overflow === "hidden") return;

    // 現在のスタイルを保存して、hiddenにする
    originalStyle.current = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = "hidden";
  }, []);

  // 解除する関数
  const unlock = useCallback(() => {
    if (typeof window === "undefined") return;

    // 保存していたスタイルに戻す
    document.body.style.overflow = originalStyle.current || "unset";
  }, []);

  return { lock, unlock };
};
