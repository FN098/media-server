import { useCallback, useRef, useState } from "react";

export function useDocumentTitleControl() {
  // 初回マウント時のタイトルを保持する
  const originalTitle = useRef<string | null>(null);

  // 現在のタイトル
  const [title, setTitleState] = useState<string>(() => {
    if (typeof document !== "undefined") {
      return document.title;
    }
    return "";
  });

  // タイトルを設定する関数
  const setTitle = useCallback((newTitle: string) => {
    if (typeof document === "undefined") return;

    // 最初の1回目だけ、現在のタイトルを保存しておく
    if (originalTitle.current === null) {
      originalTitle.current = document.title;
    }

    document.title = newTitle;
    setTitleState(newTitle);
  }, []);

  // 元のタイトルに戻す関数
  const resetTitle = useCallback(() => {
    if (typeof document === "undefined" || originalTitle.current === null) {
      return;
    }

    document.title = originalTitle.current;
    setTitleState(originalTitle.current);

    console.log(document.title);
  }, []);

  return {
    title,
    setTitle,
    resetTitle,
  };
}
