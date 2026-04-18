"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

export interface UseModalOptions {
  modalKey?: string; // デフォルト: "modal"
}

export function useViewerControl(options?: UseModalOptions) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // キー名とデフォルト値の設定
  const { modalKey = "modal" } = options || {};

  // 現在の値をURLから取得
  const modal = searchParams.get(modalKey);

  // value: 現在の状態
  const value = useMemo(() => modal, [modal]);

  // apply: URLを更新して状態を変更
  const apply = useCallback(
    (next: boolean) => {
      const params = new URLSearchParams(searchParams.toString());

      if (next === false) {
        params.delete(modalKey);
      } else {
        params.set(modalKey, "true");
      }

      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [modalKey, pathname, router, searchParams]
  );

  // reset: デフォルトの状態に戻す
  const reset = useCallback(() => apply(false), [apply]);

  return {
    value,
    apply,
    reset,
  };
}
