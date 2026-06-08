import { useQueryFilter } from "@/hooks/filters/use-query-filter";
import { useSearchFocusContext } from "@/providers/search-focus.provider";
import { useCallback, useEffect, useRef, useState } from "react";

export function useHeaderSearch() {
  const { value, apply } = useQueryFilter();
  const { register } = useSearchFocusContext();

  const [input, setInput] = useState(value.query ?? "");
  const [focused, setFocused] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const isComposingRef = useRef(false);

  // 確定時にURL反映
  const commit = useCallback(() => {
    if (isComposingRef.current) return; // IME確定待ち中はスキップ
    apply(input.trim() === "" ? null : input);
  }, [apply, input]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  }, []);

  const handleCompositionStart = useCallback(() => {
    isComposingRef.current = true;
  }, []);

  const handleCompositionEnd = useCallback(() => {
    isComposingRef.current = false;
    // compositionend 後に enter が来たケースは handleKeyDown が拾うので不要
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !isComposingRef.current) {
        commit();
        inputRef.current?.blur(); // モバイルのキーボードを閉じる
      }
      if (e.key === "Escape") {
        setInput(value.query ?? "");
        inputRef.current?.blur();
      }
    },
    [commit, value.query]
  );

  // URL側が外部から変わったとき（リセットなど）にinputを同期
  useEffect(() => {
    setInput(value.query ?? "");
  }, [value.query]);

  // マウント時に他のコンポーネントから検索バーにフォーカスできるようにする
  useEffect(() => {
    register(() => inputRef.current?.focus());
    return () => register(null);
  }, [register]);

  return {
    input,
    focused,
    inputRef,
    setInput,
    setFocused,
    handleChange,
    handleCompositionStart,
    handleCompositionEnd,
    handleKeyDown,
    commit,
  };
}
