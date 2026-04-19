"use client";

import { clamp } from "@/lib/utils/clamp";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

type Options = {
  defaultPageSize?: number;
  pageKey?: string; // パラメータ名（デフォルト "page"）
  pageSizeKey?: string; // パラメータ名（デフォルト "pageSize"）
};

const MIN_PAGE = 1;
const MAX_PAGE = 100;
const MIN_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

export function usePaging(totalItems: number, options?: Options) {
  const {
    defaultPageSize = 48,
    pageKey = "page",
    pageSizeKey = "pageSize",
  } = options ?? {};

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = useMemo(() => {
    const value = searchParams.get(pageKey);
    if (!value) return MIN_PAGE;
    const val = parseInt(value, 10) || MIN_PAGE;
    return clamp(val, MIN_PAGE, MAX_PAGE);
  }, [searchParams, pageKey]);

  const setPage = useCallback(
    (page: number) => {
      const newPage = clamp(page, MIN_PAGE, MAX_PAGE);
      const params = new URLSearchParams(searchParams.toString());
      params.set(pageKey, newPage.toString());
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, pageKey, router, pathname]
  );

  const pageSize = useMemo(() => {
    const value = searchParams.get(pageSizeKey);
    if (!value) return defaultPageSize;
    const val = parseInt(value, 10) || MIN_PAGE_SIZE;
    return clamp(val, MIN_PAGE_SIZE, MAX_PAGE_SIZE);
  }, [defaultPageSize, pageSizeKey, searchParams]);

  const setPageSize = useCallback(
    (pageSize: number) => {
      const newPageSize = clamp(pageSize, MIN_PAGE_SIZE, MAX_PAGE_SIZE);
      const params = new URLSearchParams(searchParams.toString());
      params.set(pageKey, newPageSize.toString());
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, pageKey, router, pathname]
  );

  const totalPages = useMemo(
    () => Math.ceil(totalItems / pageSize),
    [totalItems, pageSize]
  );

  const paginate = useCallback(
    <T>(items: T[]): T[] => {
      const start = (page - 1) * pageSize;
      return items.slice(start, start + pageSize);
    },
    [page, pageSize]
  );

  return {
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    paginate,
  };
}
