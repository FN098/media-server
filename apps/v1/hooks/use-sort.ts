import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

export function useSort() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const sort = searchParams.get("sort");
  const direction = searchParams.get("direction");

  const setSort = useCallback(
    (key: string | null, dir: string | null) => {
      const params = new URLSearchParams(searchParams.toString());

      if (!key || !dir) {
        params.delete("sort");
        params.delete("direction");
      } else {
        params.set("sort", key);
        params.set("direction", dir);
      }

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [pathname, router, searchParams]
  );

  return {
    sort,
    direction,
    setSort,
    isPending,
  };
}
