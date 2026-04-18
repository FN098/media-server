"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

export interface QueryFilterOptions {
  queryKey?: string; // デフォルト: "q"
}

export function useQueryFilter(options?: QueryFilterOptions) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // キー名とデフォルト値の設定
  const { queryKey = "q" } = options || {};

  // 現在の値をURLから取得
  const q = searchParams.get(queryKey);

  // value: 現在の状態
  const value = useMemo(() => q, [q]);

  // apply: URLを更新して状態を変更
  const apply = useCallback(
    (next: string | null) => {
      const params = new URLSearchParams(searchParams.toString());

      if (next == null || next.trim() === "") {
        params.delete(queryKey);
      } else {
        params.set(queryKey, next);
      }

      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams, queryKey]
  );

  // reset: デフォルトの状態に戻す
  const reset = useCallback(() => apply(null), [apply]);

  return {
    value,
    apply,
    reset,
  };
}
