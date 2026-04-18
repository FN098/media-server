"use client";

import { encodePath } from "@/lib/path/encoder";
import { getClientExplorerPath, getClientTrashPath } from "@/lib/path/helpers";
import { overrideSearchParams } from "@/lib/query/search-params";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import z from "zod";

const explorerQuerySchema = z.object({
  q: z.string().optional().nullable(),

  modal: z
    .union([z.boolean(), z.literal("true").transform(() => true)])
    .optional()
    .nullable(),

  view: z.enum(["grid", "list"]).optional().nullable(),

  at: z
    .union([z.coerce.number().int().nonnegative(), z.enum(["first", "last"])])
    .optional()
    .nullable(),

  sort: z.string().optional().nullable(),

  direction: z.enum(["asc", "desc"]).optional().nullable(),

  page: z.coerce.number().optional().nullable(),
});

type ExplorerQuery = z.infer<typeof explorerQuerySchema>;

type ExplorerQueryOptions = {
  history?: "replace" | "push";
  path?: string;
  deleted?: boolean;
};

export function useExplorerQuery() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const params = Object.fromEntries(searchParams);
  const explorerQuery = explorerQuerySchema.parse(params);

  // URLを生成するロジックを共通化
  const getExplorerUrl = useCallback(
    (query: Partial<ExplorerQuery>, options: ExplorerQueryOptions = {}) => {
      const parsed = explorerQuerySchema.parse(query);
      const search = overrideSearchParams(parsed, searchParams).toString();
      const basePath = resolveClientPath(options) || pathname;
      return search ? `${basePath}?${search}` : basePath;
    },
    [pathname, searchParams]
  );

  const setExplorerQuery = useCallback(
    (query: Partial<ExplorerQuery>, options: ExplorerQueryOptions = {}) => {
      const nextUrl = getExplorerUrl(query, options);

      // 現在のフルURLと比較
      const currentSearch = searchParams.toString();
      const currentUrl = currentSearch
        ? `${pathname}?${currentSearch}`
        : pathname;
      if (nextUrl === currentUrl) return;

      if (options.history === "push") {
        router.push(nextUrl, { scroll: false });
      } else {
        router.replace(nextUrl, { scroll: false });
      }
    },
    [getExplorerUrl, pathname, router, searchParams]
  );

  return {
    explorerQuery,
    setExplorerQuery,
    getExplorerUrl,
  };
}

function resolveClientPath(options: ExplorerQueryOptions) {
  if (!options.path) return null;

  const encoded = encodePath(options.path);

  // 削除済み
  if (options.deleted) return getClientTrashPath(encoded);

  return getClientExplorerPath(encoded);
}
