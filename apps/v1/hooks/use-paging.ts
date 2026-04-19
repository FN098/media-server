"use client";

import { clamp } from "@/lib/utils/clamp";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

export interface UsePagingOptions {
  defaultPageSize?: number;
  useUrlParams?: boolean; // URL同期を有効にするか
  pageKey?: string; // パラメータ名（デフォルト "page"）
}

export function usePaging(totalItems: number, options: UsePagingOptions = {}) {
  const {
    defaultPageSize = 48,
    useUrlParams = false,
    pageKey = "page",
  } = options;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentPage = useMemo(() => {
    if (!useUrlParams) return 1;
    const p = searchParams.get(pageKey);
    return p ? Math.max(1, parseInt(p, 10) || 1) : 1;
  }, [searchParams, pageKey, useUrlParams]);

  const pageSize = defaultPageSize;

  const totalPages = useMemo(
    () => Math.ceil(totalItems / pageSize),
    [totalItems, pageSize]
  );

  // ページ番号の補正ロジック
  const fixedCurrentPage = useMemo(
    () => clamp(currentPage, 1, totalPages),
    [currentPage, totalPages]
  );

  // ページ更新関数
  const setPage = useCallback(
    (page: number) => {
      const targetPage = Math.max(1, Math.min(page, totalPages || 1));

      if (useUrlParams) {
        const params = new URLSearchParams(searchParams.toString());
        params.set(pageKey, targetPage.toString());

        // URLを更新。Next.jsのrouterを使うことでpopstate管理も不要になります
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      }
    },
    [searchParams, pageKey, useUrlParams, totalPages, router, pathname]
  );

  const paginate = useCallback(
    <T>(items: T[]): T[] => {
      const start = (fixedCurrentPage - 1) * pageSize;
      return items.slice(start, start + pageSize);
    },
    [fixedCurrentPage, pageSize]
  );

  return {
    currentPage: fixedCurrentPage,
    pageSize,
    totalPages,
    setPage,
    paginate,
  };
}
