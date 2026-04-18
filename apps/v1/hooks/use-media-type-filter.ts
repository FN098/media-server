"use client";

import {
  MediaTypeFilterOptions,
  MediaTypeFilterValue,
} from "@/lib/filter/types";
import { MediaFsNodeType } from "@/lib/media/types";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

// --- URL parse helpers ---

function parseMediaTypeFilterValues(raw: string | null): MediaTypeFilterValue {
  if (!raw) return { types: [] };

  const valid = ["directory", "image", "video", "audio", "file"];
  // カンマ区切りなどで管理する場合
  const candidates = raw.split(",");

  const types = candidates.filter((v): v is MediaFsNodeType =>
    valid.includes(v)
  );

  return { types };
}

// --- URL serialize helpers ---

function serializeMediaTypeFilterValue(value: MediaTypeFilterValue) {
  return {
    mediaType: value.types.join(","),
  };
}

function buildParams(
  params: URLSearchParams,
  next: MediaTypeFilterValue,
  keys: { mediaTypeKey: string }
): void {
  const { mediaTypeKey } = keys;
  if (next.types.length === 0) {
    params.delete(mediaTypeKey);
    return;
  }
  const { mediaType } = serializeMediaTypeFilterValue(next);
  params.set(mediaTypeKey, mediaType);
}

// --- hook ---

export function useMediaTypeFilter(options?: MediaTypeFilterOptions) {
  const { mediaTypeKey = "mediaType" } = options ?? {};

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 現在選択されている値の配列
  const value = useMemo<MediaTypeFilterValue>(() => {
    const raw = searchParams.get(mediaTypeKey);
    if (!raw) return { types: [] };

    return parseMediaTypeFilterValues(raw);
  }, [searchParams, mediaTypeKey]);

  const apply = useCallback(
    (next: MediaTypeFilterValue) => {
      const params = new URLSearchParams(searchParams.toString());
      buildParams(params, next, {
        mediaTypeKey,
      });
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams, mediaTypeKey]
  );

  const toggle = useCallback(
    (target: MediaFsNodeType) => {
      const isExist = value.types.includes(target);
      const nextTypes = isExist
        ? value.types.filter((t) => t !== target)
        : [...value.types, target];
      apply({ types: nextTypes });
    },
    [apply, value.types]
  );

  const reset = useCallback(() => apply({ types: [] }), [apply]);

  const isActive = value.types.length > 0;

  return { value, apply, toggle, reset, isActive };
}
