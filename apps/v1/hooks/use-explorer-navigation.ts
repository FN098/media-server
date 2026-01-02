import { getClientExplorerPath } from "@/lib/path/helpers";
import { IndexLike } from "@/lib/view/types";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

type NavigationOptions = {
  query?: string;
  index?: IndexLike;
  modal?: boolean;
};

export function useExplorerNavigation() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const query = searchParams.get("q");

  const indexRaw = searchParams.get("at");
  const index: IndexLike =
    indexRaw === "first"
      ? "first"
      : indexRaw === "last"
        ? "last"
        : Number(indexRaw);

  const modal = searchParams.get("modal") === "true";

  const buildURLSearchParams = useCallback(
    (options?: NavigationOptions) => {
      const params = new URLSearchParams(searchParams);
      const query = options?.query;
      const index = options?.index;
      const modal = options?.modal;

      if (query && query.trim()) params.set("q", query.trim());
      if (index) params.set("at", String(index));
      if (modal) params.set("modal", "true");

      return params;
    },
    [searchParams]
  );

  const getFolderUrl = (path: string) => {
    return encodeURI(getClientExplorerPath(path));
  };

  const navigate = useCallback(
    (path: string, options?: NavigationOptions) => {
      const basePath = getClientExplorerPath(path);
      const params = buildURLSearchParams(options);
      const url = params.size > 0 ? `${basePath}?${params}` : `${basePath}`;
      router.push(url);
    },
    [buildURLSearchParams, router]
  );

  const refresh = useCallback(
    (options?: NavigationOptions) => {
      const basePath = pathname;
      const params = buildURLSearchParams(options);
      const url = params.size > 0 ? `${basePath}?${params}` : `${basePath}`;
      router.replace(url);
    },
    [buildURLSearchParams, pathname, router]
  );

  return useMemo(
    () => ({
      query,
      index,
      modal,
      getFolderUrl,
      navigate,
      refresh,
    }),
    [query, index, modal, navigate, refresh]
  );
}
