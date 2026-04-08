"use client";

import { encodePath } from "@/lib/path/encoder";
import { getClientExplorerPath } from "@/lib/path/helpers";
import { overrideSearchParams } from "@/lib/query/search-params";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import z from "zod";

export const explorerQuerySchema = z.object({
  q: z.string().optional().nullable().default(null),

  modal: z
    .union([z.boolean(), z.literal("true").transform(() => true)])
    .optional()
    .default(false),

  view: z.enum(["grid", "list"]).optional().nullable().default(null),

  at: z
    .union([z.coerce.number().int().nonnegative(), z.enum(["first", "last"])])
    .optional()
    .nullable()
    .default(null),

  sort: z.string().optional().nullable().default(null),

  direction: z
    .enum(["asc", "desc", "random"])
    .optional()
    .nullable()
    .default(null),
});

export type ExplorerQuery = z.infer<typeof explorerQuerySchema>;

export type ExplorerQueryOptions = {
  history?: "replace" | "push";
  path?: string;
};

export function useExplorerQuery() {
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
        ? getClientExplorerPath(encodePath(options.path))
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
