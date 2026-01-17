"use client";

import {
  useExplorerQuery,
  useNormalizeExplorerQuery,
} from "@/hooks/use-explorer-query";
import { encodePath } from "@/lib/path/encoder";
import { getClientTrashPath } from "@/lib/path/helpers";
import { normalizeExplorerQuery } from "@/lib/query/normalize";
import { toSearchParams } from "@/lib/query/search-params";
import type { ExplorerQuery, SetExplorerQueryOptions } from "@/lib/query/types";
import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";

const normalizeTrashQuery = normalizeExplorerQuery;
const useNormalizeTrashQuery = useNormalizeExplorerQuery;
const useTrashQuery = useExplorerQuery;

export { useNormalizeTrashQuery, useTrashQuery };

export function useSetTrashQuery() {
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

      const normalized = normalizeTrashQuery(merged);
      const search = toSearchParams(normalized);

      const basePath = options.path
        ? getClientTrashPath(encodePath(options.path)) // Changed line
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
