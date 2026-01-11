"use client";

import { getClientExplorerPath } from "@/lib/path/helpers";
import { normalizeExplorerQuery } from "@/lib/query/normalize";
import { toSearchParams } from "@/lib/query/search-params";
import type { ExplorerQuery, SetExplorerQueryOptions } from "@/lib/query/types";
import { explorerQuerySchema } from "@/lib/query/validation";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";

export function useExplorerQuery() {
  const searchParams = useSearchParams();
  const params = Object.fromEntries(searchParams);
  const query = explorerQuerySchema.parse(params);

  return {
    ...query,
  };
}

export function useNormalizeExplorerQuery() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const query = useExplorerQuery();

  useEffect(() => {
    const normalized = normalizeExplorerQuery(query);
    const next = toSearchParams(normalized);
    const current = searchParams.toString();

    if (next !== current) {
      router.replace(next ? `${pathname}?${next}` : pathname);
    }
  }, [query, pathname, router, searchParams]);
}

export function useSetExplorerQuery() {
  const router = useRouter();
  const pathname = usePathname();
  const current = useExplorerQuery();

  return useCallback(
    (
      partial: Partial<ExplorerQuery>,
      options: SetExplorerQueryOptions = {}
    ) => {
      const merged: ExplorerQuery = {
        ...current,
        ...partial,
      };

      const normalized = normalizeExplorerQuery(merged);
      const search = toSearchParams(normalized);

      const basePath = options.path
        ? getClientExplorerPath(options.path)
            .split("/")
            .map((segment) => encodeURIComponent(segment))
            .join("/")
        : pathname;

      const url = search ? `${basePath}?${search}` : basePath;

      if (options.history === "push") {
        router.push(url);
      } else {
        router.replace(url);
      }
    },
    [current, pathname, router]
  );
}
