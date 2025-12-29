import { useCallback, useRef } from "react";

export function useTitleControl() {
  // 初回マウント時のタイトルを保持する
  const originalTitle = useRef<string | null>(null);

  // タイトルを設定する関数
  const setTitle = useCallback((newTitle: string) => {
    // 最初の1回目だけ、現在のタイトルを保存しておく
    if (originalTitle.current === null && typeof document !== "undefined") {
      originalTitle.current = document.title;
    }
    document.title = newTitle;
  }, []);

  // 元のタイトルに戻す関数
  const resetTitle = useCallback(() => {
    if (originalTitle.current !== null && typeof document !== "undefined") {
      document.title = originalTitle.current;
    }
  }, []);

  return { setTitle, resetTitle };
}
