import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

interface UseSearchParamsControlOptions {
  keep?: string[];
}

export function useSearchParamsControl({
  keep = [],
}: UseSearchParamsControlOptions = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const hasSearchParams = useMemo(() => {
    return searchParams.size > 0;
  }, [searchParams]);

  const hasResettableSearchParams = useMemo(() => {
    for (const key of searchParams.keys()) {
      if (!keep.includes(key)) {
        return true;
      }
    }
    return false;
  }, [searchParams, keep]);

  const clearSearchParams = useCallback(() => {
    if (keep.length === 0) {
      router.replace(pathname);
      return;
    }

    const nextParams = new URLSearchParams();

    for (const key of keep) {
      const values = searchParams.getAll(key);

      for (const value of values) {
        nextParams.append(key, value);
      }
    }

    const query = nextParams.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }, [router, pathname, searchParams, keep]);

  return {
    hasSearchParams,
    hasResettableSearchParams,
    clearSearchParams,
  };
}
