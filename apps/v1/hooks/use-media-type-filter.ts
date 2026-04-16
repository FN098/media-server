"use client";

import {
  MediaTypeFilterOptions,
  MediaTypeFilterValue,
} from "@/lib/filter/types";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

// --- URL parse helpers ---

function parseMediaTypeFilterValue(raw: string | null): MediaTypeFilterValue {
  const valid = ["all", "directory", "image", "video", "audio"];
  return valid.includes(raw ?? "") ? (raw as MediaTypeFilterValue) : "all";
}

// --- URL serialize helpers ---

function buildParams(
  params: URLSearchParams,
  next: MediaTypeFilterValue,
  valueKey: string
): void {
  if (next === "all") {
    params.delete(valueKey);
  } else {
    params.set(valueKey, next);
  }
}

// --- hook ---

export function useMediaTypeFilter(options?: MediaTypeFilterOptions) {
  const { mediaTypeKey = "mediaType" } = options ?? {};

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const value = useMemo<MediaTypeFilterValue>(
    () => parseMediaTypeFilterValue(searchParams.get(mediaTypeKey)),
    [searchParams, mediaTypeKey]
  );

  const apply = useCallback(
    (next: MediaTypeFilterValue) => {
      const params = new URLSearchParams(searchParams.toString());
      buildParams(params, next, mediaTypeKey);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams, mediaTypeKey]
  );

  const reset = useCallback(() => apply("all"), [apply]);

  const isActive = value !== "all";

  return { value, apply, reset, isActive };
}
