"use client";

import { useCallback, useMemo, useState } from "react";

export function usePaging(totalItems: number, defaultPageSize = 48) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(defaultPageSize);

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

  const setPage = useCallback(
    (page: number) => {
      setCurrentPage(Math.max(1, Math.min(page, totalPages || 1)));
    },
    [totalPages]
  );

  const setPageSize = useCallback((size: number) => {
    setPageSizeState(size);
    setCurrentPage(1); // サイズ変更時は1ページ目へ
  }, []);

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
