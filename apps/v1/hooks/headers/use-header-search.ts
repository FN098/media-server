import { useQueryFilter } from "@/hooks/filters/use-query-filter";
import { useSearchFocusContext } from "@/providers/search-focus.provider";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

export function useHeaderSearch() {
  const { value, apply } = useQueryFilter();
  const { register } = useSearchFocusContext();

  const [input, setInput] = useState(value.query ?? "");
  const [focused, setFocused] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const shouldRestoreFocusRef = useRef(false);
  const isComposingRef = useRef(false);

  const restoreFocus = useCallback(() => {
    requestAnimationFrame(() => {
      if (!shouldRestoreFocusRef.current || !inputRef.current) return;
      shouldRestoreFocusRef.current = false;
      if (document.activeElement === inputRef.current) return;
      inputRef.current.focus({ preventScroll: true });
      setFocused(true);
    });
  }, []);

  const debouncedApply = useDebouncedCallback((v: string | null) => {
    shouldRestoreFocusRef.current = document.activeElement === inputRef.current;
    apply(v);
  }, 300);

  // IME確定後に即時適用（デバウンスをflush）
  const handleCompositionEnd = useCallback(
    (e: React.CompositionEvent<HTMLInputElement>) => {
      isComposingRef.current = false;
      const value = e.currentTarget.value;
      debouncedApply.cancel();
      shouldRestoreFocusRef.current = true;
      apply(value);
    },
    [apply, debouncedApply]
  );

  // マウント時に他のコンポーネントから検索バーにフォーカスできるようにする
  useEffect(() => {
    register(() => inputRef.current?.focus());
    return () => register(null);
  }, [register]);

  // URLクエリが変更されたら、フォーカスを復元して入力状態に反映
  useEffect(() => {
    const nextInput = value.query ?? "";
    const frame = requestAnimationFrame(() => setInput(nextInput));
    restoreFocus();
    return () => cancelAnimationFrame(frame);
  }, [restoreFocus, value.query]);

  // onChange で isComposing 中は apply しない
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = e.target.value;
      setInput(v);
      if (!isComposingRef.current) {
        debouncedApply(v);
      }
    },
    [debouncedApply]
  );

  return {
    input,
    focused,
    inputRef,
    isComposingRef,
    setInput,
    setFocused,
    handleChange,
    handleCompositionEnd,
    debouncedApply,
  };
}
