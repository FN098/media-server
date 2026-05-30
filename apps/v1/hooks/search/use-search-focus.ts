import { useCallback, useRef } from "react";

export type SearchFocus = ReturnType<typeof useSearchFocus>;

export function useSearchFocus() {
  // フォーカスを実行するための関数を保持する
  const focusFnRef = useRef<() => void>(() => {});

  // 検索窓側が「自分のフォーカス関数」を登録するために使う
  const register = useCallback((fn: () => void) => {
    focusFnRef.current = fn;
  }, []);

  // ショートカット側が実行するために使う
  const trigger = useCallback(() => {
    focusFnRef.current();
  }, []);

  return { register, trigger };
}
