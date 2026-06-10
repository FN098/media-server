import { clamp } from "@/lib/utils/clamp";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

const MIN_PAGE = 1;
const MAX_PAGE = 100;
const MIN_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

interface UsePagingProps {
  totalCount: number;
  defaultPageSize?: number;
  pageKey?: string;
  pageSizeKey?: string;
  history?: "push" | "replace";
}

export function usePaging({
  totalCount,
  defaultPageSize = 48,
  pageKey = "page",
  pageSizeKey = "pageSize",
  history = "replace",
}: UsePagingProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [page, setPageState] = useState(() => {
    const value = searchParams.get(pageKey);
    if (!value) return MIN_PAGE;

    const parsed = parseInt(value, 10);
    return clamp(parsed || MIN_PAGE, MIN_PAGE, MAX_PAGE);
  });

  const [pageSize, setPageSizeState] = useState(() => {
    const value = searchParams.get(pageSizeKey);
    if (!value) return defaultPageSize;

    const parsed = parseInt(value, 10);
    return clamp(parsed || MIN_PAGE_SIZE, MIN_PAGE_SIZE, MAX_PAGE_SIZE);
  });

  const updateUrl = useCallback(
    (newPage: number, newPageSize: number) => {
      const params = new URLSearchParams(window.location.search);

      params.set(pageKey, String(newPage));
      params.set(pageSizeKey, String(newPageSize));

      const url = `${pathname}?${params.toString()}`;

      if (history === "push") {
        window.history.pushState(window.history.state, "", url);
      } else {
        window.history.replaceState(window.history.state, "", url);
      }
    },
    [history, pathname, pageKey, pageSizeKey]
  );

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const effectivePage = clamp(page, 1, totalPages);

  const setPage = useCallback(
    (page: number) => {
      const newPage = clamp(page, MIN_PAGE, Math.min(MAX_PAGE, totalPages));

      setPageState(newPage);
      updateUrl(newPage, pageSize);
    },
    [pageSize, totalPages, updateUrl]
  );

  const setPageSize = useCallback(
    (pageSize: number) => {
      const newPageSize = clamp(pageSize, MIN_PAGE_SIZE, MAX_PAGE_SIZE);

      const newTotalPages = Math.max(1, Math.ceil(totalCount / newPageSize));

      const newPage = clamp(effectivePage, 1, newTotalPages);

      setPageSizeState(newPageSize);
      setPageState(newPage);

      updateUrl(newPage, newPageSize);
    },
    [effectivePage, totalCount, updateUrl]
  );

  const paginate = useCallback(
    <T>(items: T[]): T[] => {
      const start = (effectivePage - 1) * pageSize;

      return items.slice(start, start + pageSize);
    },
    [effectivePage, pageSize]
  );

  return {
    page: effectivePage,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    paginate,
  };
}
