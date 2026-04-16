"use client";

import { useTags } from "@/hooks/use-tags";
import {
  TagFilterMode,
  TagFilterOptions,
  TagFilterValue,
} from "@/lib/filter/types";
import { unique } from "@/lib/utils/array";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

// --- URL parse helpers ---

function parseTagIds(raw: string | null): string[] {
  return raw ? raw.split(",") : [];
}

function parseMode(raw: string | null): TagFilterMode {
  return (raw as TagFilterMode) || "AND";
}

// --- URL serialize helpers ---

function buildParams(
  params: URLSearchParams,
  next: TagFilterValue,
  keys: { tagsKey: string; modeKey: string }
): void {
  const { tagsKey, modeKey } = keys;
  const tagIds = unique(next.tags.map((t) => t.id));

  if (next.mode === "EMPTY") {
    params.delete(tagsKey);
    params.set(modeKey, "EMPTY");
  } else if (next.mode === "AND" && tagIds.length === 0) {
    params.delete(tagsKey);
    params.delete(modeKey);
  } else {
    params.set(tagsKey, tagIds.join(","));
    params.set(modeKey, next.mode);
  }
}

// --- hook ---

export function useTagFilter(options?: TagFilterOptions) {
  const { tagsKey = "tagIds", modeKey = "tagFilterMode" } = options ?? {};

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tagIds = useMemo(
    () => parseTagIds(searchParams.get(tagsKey)),
    [searchParams, tagsKey]
  );

  const { tags } = useTags({
    strategy: "ids-only",
    ids: tagIds,
  });

  const mode = useMemo(
    () => parseMode(searchParams.get(modeKey)),
    [modeKey, searchParams]
  );

  const value = {
    mode,
    tags,
  };

  const apply = useCallback(
    (next: TagFilterValue) => {
      const params = new URLSearchParams(searchParams.toString());
      buildParams(params, next, { tagsKey, modeKey });
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [modeKey, pathname, router, searchParams, tagsKey]
  );

  const reset = useCallback(() => apply({ mode: "AND", tags: [] }), [apply]);

  return {
    value,
    apply,
    reset,
  };
}
