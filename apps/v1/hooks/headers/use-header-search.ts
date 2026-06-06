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

  return {
    input,
    focused,
    inputRef,
    setInput,
    setFocused,
    debouncedApply,
  };
}
