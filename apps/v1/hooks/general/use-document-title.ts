import { useCallback, useRef, useState } from "react";

export function useDocumentTitle() {
  const originalTitle = useRef<string | null>(null);

  const [title, setTitleState] = useState<string>(() => {
    if (typeof document !== "undefined") {
      return document.title;
    }
    return "";
  });

  const setTitle = useCallback((newTitle: string) => {
    if (typeof document === "undefined") return;

    // 最初の1回目だけ、現在のタイトルを保存しておく
    if (originalTitle.current === null) {
      originalTitle.current = document.title;
    }

    document.title = newTitle;
    setTitleState(newTitle);
  }, []);

  const resetTitle = useCallback(() => {
    if (typeof document === "undefined" || originalTitle.current === null) {
      return;
    }

    document.title = originalTitle.current;
    setTitleState(originalTitle.current);
  }, []);

  return {
    title,
    setTitle,
    resetTitle,
  };
}

export type DocumentTitleContext = ReturnType<typeof useDocumentTitle>;
