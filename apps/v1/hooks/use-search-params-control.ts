import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

export function useSearchParamsControl() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const hasSearchParams = useMemo(() => {
    return searchParams.size > 0;
  }, [searchParams]);

  const clearSearchParams = useCallback(() => {
    router.replace(pathname);
  }, [router, pathname]);

  return {
    hasSearchParams,
    clearSearchParams,
  };
}
