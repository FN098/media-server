"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

/** @deprecated 動作がもっさりする */
export function usePagingWithURL(totalItems: number, defaultPageSize = 48) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URLから現在のページとページサイズを取得
  const currentPage = useMemo(() => {
    const p = searchParams.get("p");
    return p ? Math.max(1, parseInt(p)) : 1;
  }, [searchParams]);

  const pageSize = useMemo(() => {
    const ps = searchParams.get("ps");
    return ps ? Math.max(1, parseInt(ps)) : defaultPageSize;
  }, [searchParams, defaultPageSize]);

  const totalPages = useMemo(
    () => Math.ceil(totalItems / pageSize),
    [totalItems, pageSize]
  );

  // URL更新ロジック
  const setPage = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("p", page.toString());
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const setPageSize = useCallback(
    (size: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("ps", size.toString());
      params.set("p", "1"); // サイズ変更時は1ページ目へ
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  // データを現在のページ分に切り出す関数
  const paginate = useCallback(
    <T>(items: T[]): T[] => {
      const start = (currentPage - 1) * pageSize;
      return items.slice(start, start + pageSize);
    },
    [currentPage, pageSize]
  );

  return {
    currentPage,
    pageSize,
    totalPages,
    setPage,
    setPageSize,
    paginate,
  };
}
