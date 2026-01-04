"use client";

import { useCallback, useMemo, useRef, useState } from "react";

export function useSearch(initialQuery?: string) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = useState<string>(initialQuery ?? "");

  const focus = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  return useMemo(
    () => ({
      inputRef,
      query,
      setQuery,
      focus,
    }),
    [focus, query]
  );
}
