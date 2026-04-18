"use client";

import { MediaNode } from "@/lib/media/types";
import { IndexLike } from "@/lib/query/types";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export interface UseViewerControlOptions {
  atKey?: string; // デフォルト: "at"
  modalKey?: string; // デフォルト: "modal"
}

type ViewerOpenOptions = {
  newTab?: boolean;
};

function normalizeIndex(at: IndexLike, total: number) {
  if (at === "first") return 0;
  if (at === "last") return total - 1;

  // 数字かもしれない場合
  const index = Number(at);
  if (Number.isNaN(index)) return 0;

  return index;
}

export function useViewerControl(
  nodes: MediaNode[],
  options?: UseViewerControlOptions
) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // キー名とデフォルト値の設定
  const { atKey = "at", modalKey = "modal" } = options || {};

  // 現在の値をURLから取得
  const at = searchParams.get(atKey) as IndexLike;
  const modal = searchParams.get(modalKey);

  // number に正規化されたインデックス
  const normalizedIndex = normalizeIndex(at, nodes.length);

  // ビューアを起動
  const open = useCallback(
    (at: IndexLike, options?: ViewerOpenOptions) => {
      const params = new URLSearchParams(searchParams.toString());

      params.set(modalKey, "true");
      params.set(atKey, String(at));

      if (options?.newTab) {
        window.open(`${pathname}?${params.toString()}`, "_blank", "noreferrer");
      } else {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      }
    },
    [atKey, modalKey, pathname, router, searchParams]
  );

  // ビューアを閉じる
  const close = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());

    params.delete(modalKey);
    params.delete(atKey);

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [atKey, modalKey, pathname, router, searchParams]);

  return {
    at,
    modal,
    normalizedIndex,
    isOpen: modal,
    open,
    close,
  };
}
