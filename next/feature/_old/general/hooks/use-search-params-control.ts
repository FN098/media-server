import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

interface UseSearchParamsControlOptions {
  keep?: string[];
  omit?: string[];
}

export function useSearchParamsControl({
  keep = [],
  omit = [],
}: UseSearchParamsControlOptions = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const hasAny = useMemo(() => {
    return searchParams.size > 0;
  }, [searchParams]);

  const canClear = useMemo(() => {
    for (const key of searchParams.keys()) {
      if (
        (keep.length > 0 && !keep.includes(key)) ||
        (omit.length > 0 && omit.includes(key))
      ) {
        return true;
      }
    }

    return false;
  }, [searchParams, keep, omit]);

  const clear = useCallback(() => {
    // 全削除
    if (keep.length === 0 && omit.length === 0) {
      router.replace(pathname);
      return;
    }

    const nextParams = new URLSearchParams();

    for (const [key, value] of searchParams.entries()) {
      // keep モード
      if (keep.length > 0) {
        if (keep.includes(key)) {
          nextParams.append(key, value);
        }

        continue;
      }

      // omit モード
      if (!omit.includes(key)) {
        nextParams.append(key, value);
      }
    }

    const query = nextParams.toString();

    router.replace(query ? `${pathname}?${query}` : pathname);
  }, [router, pathname, searchParams, keep, omit]);

  return {
    count: searchParams.size,
    hasAny,
    canClear,
    clear,
  };
}
