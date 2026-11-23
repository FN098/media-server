import { QueryFilterValue } from "@/feature/search/lib/filter";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

interface UseQueryFilterProps {
  queryKey?: string;
}

export function useQueryFilter(props?: UseQueryFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { queryKey = "q" } = props || {};

  const query = searchParams.get(queryKey);

  const value = useMemo<QueryFilterValue>(() => ({ query }), [query]);

  const apply = useCallback(
    (next: string | null) => {
      const params = new URLSearchParams(searchParams.toString());

      if (next == null || next.trim() === "") {
        params.delete(queryKey);
      } else {
        params.set(queryKey, next);
      }

      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams, queryKey]
  );

  const reset = useCallback(() => apply(null), [apply]);

  return {
    value,
    apply,
    reset,
  };
}
