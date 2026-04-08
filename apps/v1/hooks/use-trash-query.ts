"use client";

import {
  ExplorerQuery,
  ExplorerQueryOptions,
  explorerQuerySchema,
} from "@/hooks/use-explorer-query";
import { encodePath } from "@/lib/path/encoder";
import { getClientTrashPath } from "@/lib/path/helpers";
import { overrideSearchParams } from "@/lib/query/search-params";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export function useTrashQuery() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const params = Object.fromEntries(searchParams);
  const explorerQuery = explorerQuerySchema.parse(params);

  const setExplorerQuery = useCallback(
    (query: Partial<ExplorerQuery>, options: ExplorerQueryOptions = {}) => {
      const parsed = explorerQuerySchema.parse(query);

      // 既存のパラメータに新しい値をマージ
      const search = overrideSearchParams(parsed, searchParams).toString();

      // ベースパスの決定
      const basePath = options.path
        ? getClientTrashPath(encodePath(options.path)) // ★ ここが違う
        : pathname;

      // 遷移先のフルURLを作成
      const nextUrl = search ? `${basePath}?${search}` : basePath;

      // 現在のフルURLを作成（比較用）
      const currentSearch = searchParams.toString();
      const currentUrl = currentSearch
        ? `${pathname}?${currentSearch}`
        : pathname;

      // URLが変わらなければ何もしない
      if (nextUrl === currentUrl) return;

      if (options.history === "push") {
        router.push(nextUrl, { scroll: false });
      } else {
        router.replace(nextUrl, { scroll: false });
      }
    },
    [pathname, router, searchParams]
  );

  return {
    explorerQuery,
    setExplorerQuery,
  };
}
