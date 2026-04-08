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
    .literal("true")
    .transform(() => true)
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

      const merged: ExplorerQuery = {
        ...query,
        ...parsed,
      };

      const search = overrideSearchParams(merged, searchParams).toString();

      // クエリ内容が変わらなければ何もしない
      if (search === searchParams.toString()) return;

      const basePath = options.path
        ? getClientExplorerPath(encodePath(options.path))
        : pathname;

      const url = search ? `${basePath}?${search}` : basePath;

      if (options.history === "push") {
        router.push(url, { scroll: false });
      } else {
        router.replace(url, { scroll: false });
      }
    },
    [pathname, router, searchParams]
  );

  return {
    explorerQuery,
    setExplorerQuery,
  };
}
