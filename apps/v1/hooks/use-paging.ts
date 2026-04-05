"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

export interface UsePagingOptions {
  defaultPageSize?: number;
  useUrlParams?: boolean; // URL同期を有効にするか
  paramName?: string; // パラメータ名（デフォルト "page"）
}

export function usePaging(totalItems: number, options: UsePagingOptions = {}) {
  const {
    defaultPageSize = 48,
    useUrlParams = false,
    paramName = "page",
  } = options;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 内部ステート（URLを使わない場合のフォールバック）
  const [internalPage, setInternalPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(defaultPageSize);

  // 現在のページ番号をどこから取得するか決定
  const currentPage = useMemo(() => {
    if (useUrlParams) {
      const p = searchParams.get(paramName);
      return p ? parseInt(p, 10) || 1 : 1;
    }
    return internalPage;
  }, [useUrlParams, searchParams, paramName, internalPage]);

  const totalPages = useMemo(
    () => Math.ceil(totalItems / pageSize),
    [totalItems, pageSize]
  );

  // アイテム総数が減って、現在のページが最大ページを超えてしまった時の補正
  const fixedCurrentPage = useMemo(() => {
    if (currentPage > totalPages && totalPages > 0) {
      return totalPages;
    }
    return currentPage;
  }, [currentPage, totalPages]);

  // ページ更新関数
  const setPage = useCallback(
    (page: number) => {
      const targetPage = Math.max(1, Math.min(page, totalPages || 1));

      if (useUrlParams) {
        const params = new URLSearchParams(searchParams.toString());
        params.set(paramName, targetPage.toString());
        router.push(`${pathname}?${params.toString()}`);
      } else {
        setInternalPage(targetPage);
      }
    },
    [useUrlParams, totalPages, searchParams, paramName, router, pathname]
  );

  const setPageSize = useCallback(
    (size: number) => {
      setPageSizeState(size);
      setPage(1);
    },
    [setPage]
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
    setPageSize,
    paginate,
  };
}
