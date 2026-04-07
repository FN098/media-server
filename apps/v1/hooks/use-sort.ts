import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

interface UseSortOptions {
  sortKey?: string; // デフォルト: "sort"
  directionKey?: string; // デフォルト: "direction"
  pageKey?: string; // デフォルト: "page"
}

export function useSort(options?: UseSortOptions) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // キー名のマッピング（デフォルト値を設定）
  const {
    sortKey = "sort",
    directionKey = "direction",
    pageKey = "page",
  } = options || {};

  const sort = searchParams.get(sortKey);
  const direction = searchParams.get(directionKey);

  const setSort = useCallback(
    (key: string | null, dir: string | null) => {
      const params = new URLSearchParams(searchParams.toString());

      // ソート変更時にページングリセット
      params.delete(pageKey);

      if (!key || !dir) {
        params.delete(sortKey);
        params.delete(directionKey);
      } else {
        params.set(sortKey, key);
        params.set(directionKey, dir);
      }

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [directionKey, pageKey, pathname, router, searchParams, sortKey]
  );

  return {
    sort,
    direction,
    setSort,
    isPending,
  };
}
