"use client";

import { ViewMode } from "@/lib/query/types";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

type Options = {
  viewModeKey?: string; // デフォルト: "viewMode"
  defaultViewMode?: ViewMode; // デフォルト: "grid"
};

export function useViewMode(options?: Options) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // キー名とデフォルト値の設定
  const { viewModeKey = "viewMode", defaultViewMode = "grid" } = options || {};

  // 現在の値をURLから取得
  const viewMode =
    (searchParams.get(viewModeKey) as ViewMode) || defaultViewMode;

  // value: 現在の状態
  const value = useMemo(() => viewMode, [viewMode]);

  // apply: URLを更新して状態を変更
  const apply = useCallback(
    (next: ViewMode) => {
      const params = new URLSearchParams(searchParams.toString());

      if (next === defaultViewMode) {
        params.delete(viewModeKey);
      } else {
        params.set(viewModeKey, next);
      }

      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [defaultViewMode, pathname, router, searchParams, viewModeKey]
  );

  // reset: デフォルトの状態に戻す
  const reset = useCallback(
    () => apply(defaultViewMode),
    [apply, defaultViewMode]
  );

  return {
    value,
    apply,
    reset,
  };
}
