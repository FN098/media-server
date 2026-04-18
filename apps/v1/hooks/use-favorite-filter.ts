"use client";

import { FavoriteFilterMode, FavoriteFilterOptions } from "@/lib/filter/types";
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
  next: FavoriteFilterMode,
  valueKey: string
): void {
  if (next === "all") {
    params.delete(valueKey);
  } else {
    params.set(valueKey, next);
  }
}

// --- hook ---

export function useFavoriteFilter(options?: FavoriteFilterOptions) {
  const { modeKey = "favoriteFilterMode" } = options ?? {};

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const value = useMemo<FavoriteFilterMode>(
    () => parseFavoriteFilterMode(searchParams.get(modeKey)),
    [searchParams, modeKey]
  );

  const apply = useCallback(
    (next: FavoriteFilterMode) => {
      const params = new URLSearchParams(searchParams.toString());
      buildParams(params, next, modeKey);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams, modeKey]
  );

  const reset = useCallback(() => apply("all"), [apply]);

  const isActive = value !== "all";

  return { value, apply, reset, isActive };
}
