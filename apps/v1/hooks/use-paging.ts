"use client";

import { clamp } from "@/lib/utils/clamp";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

type Options = {
  defaultPageSize?: number;
  pageKey?: string; // パラメータ名（デフォルト "page"）
  pageSizeKey?: string; // パラメータ名（デフォルト "pageSize"）
  history?: "push" | "replace";
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
    history = "push",
  } = options ?? {};

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const navigate = useCallback(
    (url: string) => {
      if (history === "push") {
        router.push(url, { scroll: false });
      } else {
        router.replace(url, { scroll: false });
      }
    },
    [history, router]
  );

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
      navigate(`${pathname}?${params.toString()}`);
    },
    [searchParams, pageKey, navigate, pathname]
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
      params.set(pageSizeKey, newPageSize.toString());
      navigate(`${pathname}?${params.toString()}`);
    },
    [searchParams, pageSizeKey, navigate, pathname]
  );

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const effectivePage = clamp(page, 1, totalPages);

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
