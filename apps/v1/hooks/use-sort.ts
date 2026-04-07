import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

interface UseSortOptions {
  sortKey?: string; // デフォルト: "sort"
  directionKey?: string; // デフォルト: "direction"
}

export function useSort(options?: UseSortOptions) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // キー名のマッピング（デフォルト値を設定）
  const { sortKey = "sort", directionKey = "direction" } = options || {};

  const sort = searchParams.get(sortKey);
  const direction = searchParams.get(directionKey);

  const setSort = useCallback(
    (key: string | null, dir: string | null) => {
      const params = new URLSearchParams(searchParams.toString());

      params.delete("page");

      if (!key || !dir) {
        params.delete("sort");
        params.delete("direction");
      } else {
        params.set("sort", key);
        params.set("direction", dir);
      }

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [pathname, router, searchParams]
  );

  return {
    sort,
    direction,
    setSort,
    isPending,
  };
}
