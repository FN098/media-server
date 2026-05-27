import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import z from "zod";

type SortValue = {
  sort: string; // 並び替えのフィールド名
  direction: "asc" | "desc"; // 並び替えの向き
};

const directionSchema = z.enum(["asc", "desc"]).nullable();

interface UseSortProps {
  sortKey?: string;
  directionKey?: string;
  resetKeys?: string[];
}

export function useSort({
  sortKey = "sort",
  directionKey = "direction",
  resetKeys = ["page"],
}: UseSortProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 現在の値をURLから取得
  const sort = searchParams.get(sortKey);
  const direction = searchParams.get(directionKey);

  // value: 現在の状態
  const value = useMemo<SortValue | null>(() => {
    const safeDirection = directionSchema.safeParse(direction).data;
    if (sort && safeDirection) return { sort, direction: safeDirection };
    return null;
  }, [sort, direction]);

  // apply: URLを更新して状態を変更
  const apply = useCallback(
    (next: SortValue | null) => {
      const params = new URLSearchParams(searchParams.toString());

      // ソート変更時にリセット
      resetKeys.forEach((k) => params.delete(k));

      if (!next) {
        params.delete(sortKey);
        params.delete(directionKey);
      } else {
        params.set(sortKey, next.sort);
        params.set(directionKey, next.direction);
      }

      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [directionKey, pathname, resetKeys, router, searchParams, sortKey]
  );

  // reset: デフォルトの状態に戻す
  const reset = useCallback(() => apply(null), [apply]);

  return {
    value,
    apply,
    reset,
  };
}
