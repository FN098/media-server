import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

type Options = {
  sortKey?: string; // デフォルト: "sort"
  directionKey?: string; // デフォルト: "direction"
  pageKey?: string; // デフォルト: "page"
};

type SortValue = {
  key: string | null;
  direction: string | null;
};

export function useSort(options?: Options) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // キー名とデフォルト値の設定
  const {
    sortKey = "sort",
    directionKey = "direction",
    pageKey = "page",
  } = options || {};

  // 現在の値をURLから取得
  const sort = searchParams.get(sortKey);
  const direction = searchParams.get(directionKey);

  // value: 現在の状態
  const value = useMemo<SortValue>(
    () => ({
      key: sort,
      direction,
    }),
    [direction, sort]
  );

  // apply: URLを更新して状態を変更
  const apply = useCallback(
    (next: SortValue) => {
      const params = new URLSearchParams(searchParams.toString());

      // ソート変更時にページリセット
      params.delete(pageKey);

      if (!next.key || !next.direction) {
        params.delete(sortKey);
        params.delete(directionKey);
      } else {
        params.set(sortKey, next.key);
        params.set(directionKey, next.direction);
      }

      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [directionKey, pageKey, pathname, router, searchParams, sortKey]
  );

  // reset: デフォルトの状態に戻す
  const reset = useCallback(
    () => apply({ key: null, direction: null }),
    [apply]
  );

  return {
    value,
    apply,
    reset,
  };
}
