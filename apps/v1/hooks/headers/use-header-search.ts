import { useQueryFilter } from "@/hooks/filters/use-query-filter";
import { useSearchFocusContext } from "@/providers/search-focus-provider";
import {
  startTransition,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

export function useHeaderSearch() {
  const { value, apply } = useQueryFilter();
  const { register } = useSearchFocusContext();

  const [input, setInput] = useState(value.query ?? "");
  const [focused, setFocused] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const isComposingRef = useRef(false);

  // 確定時にURL反映
  const commit = useCallback(
    (query: string) => {
      if (isComposingRef.current) return; // IME確定待ち中はスキップ
      apply(query.trim() === "" ? null : query);
    },
    [apply]
  );

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
        commit(input);
        inputRef.current?.blur(); // モバイルのキーボードを閉じる
      }
      if (e.key === "Escape") {
        e.preventDefault(); // type="search" のクリア動作を止める
        const currentQuery = value.query ?? "";
        setInput(currentQuery); // 編集前の値に戻す
        inputRef.current?.blur();
        // commitしない → URLは変えない
      }
    },
    [commit, input, value.query]
  );

  // URL側が外部から変わったとき（リセットなど）にinputを同期
  useEffect(() => {
    startTransition(() => {
      setInput(value.query ?? "");
    });
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
