"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

type Options = {
  pinnedKey?: string; // デフォルト: "pinned"
};

export function usePinned(options?: Options) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // キー名とデフォルト値の設定
  const { pinnedKey = "pinned" } = options || {};

  // 現在の値をURLから取得
  const pinned = searchParams.get(pinnedKey);

  // value: 現在の状態
  const value = useMemo(() => pinned === "true", [pinned]);

  // apply: URLを更新して状態を変更
  const apply = useCallback(
    (next: boolean) => {
      const params = new URLSearchParams(searchParams.toString());

      if (next === false) {
        params.delete(pinnedKey);
      } else {
        params.set(pinnedKey, "true");
      }

      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pinnedKey, pathname, router, searchParams]
  );

  // reset: デフォルトの状態に戻す
  const reset = useCallback(() => apply(false), [apply]);

  const toggle = useCallback(() => apply(!value), [apply, value]);

  return {
    value,
    apply,
    reset,
    toggle,
  };
}
