import { useCallback, useRef } from "react";

type Callback = () => void;

export function useSearchFocus() {
  // フォーカスを実行するための関数を保持する
  const focusFnRef = useRef<Callback>(null);

  // 検索窓側が「自分のフォーカス関数」を登録するために使う
  const register = useCallback((fn: Callback | null) => {
    focusFnRef.current = fn;
  }, []);

  // ショートカット側が実行するために使う
  const trigger = useCallback(() => {
    focusFnRef.current?.();
  }, []);

  return { register, trigger };
}

export type SearchFocus = ReturnType<typeof useSearchFocus>;
