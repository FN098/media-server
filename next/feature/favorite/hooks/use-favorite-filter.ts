import { FavoriteFilterMode, FavoriteFilterValue } from "@/lib/filter/types";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

// --- URL parse helpers ---

function parseFavoriteFilterMode(raw: string | null): FavoriteFilterMode {
  const valid = ["all", "only_favorites", "exclude_favorites"];
  return valid.includes(raw ?? "") ? (raw as FavoriteFilterMode) : "all";
}

// --- URL serialize helpers ---

function buildParams(
  params: URLSearchParams,
  next: FavoriteFilterValue,
  keys: { modeKey: string }
): void {
  const { modeKey } = keys;
  if (next.mode === "all") {
    params.delete(modeKey);
  } else {
    params.set(modeKey, next.mode);
  }
}

// --- hook ---

interface UseFavoriteFilterProps {
  modeKey?: string;
}

export function useFavoriteFilter({
  modeKey = "favoriteFilterMode",
}: UseFavoriteFilterProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const mode = useMemo(
    () => parseFavoriteFilterMode(searchParams.get(modeKey)),
    [modeKey, searchParams]
  );

  const value = useMemo<FavoriteFilterValue>(() => ({ mode }), [mode]);

  const apply = useCallback(
    (next: FavoriteFilterValue) => {
      const params = new URLSearchParams(searchParams.toString());
      buildParams(params, next, { modeKey });
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams, modeKey]
  );

  const reset = useCallback(() => apply({ mode: "all" }), [apply]);

  const isActive = mode !== "all";

  return { value, apply, reset, isActive };
}
