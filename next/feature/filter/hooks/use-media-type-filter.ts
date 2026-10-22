import { FileTypeFilterValue } from "@/lib/filter/types";
import { MediaFsNodeType } from "@/lib/node/types";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

// --- URL parse helpers ---

function parseMediaTypeFilterValues(raw: string | null): FileTypeFilterValue {
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

function serializeMediaTypeFilterValue(value: FileTypeFilterValue) {
  return {
    mediaType: value.types.join(","),
  };
}

function buildParams(
  params: URLSearchParams,
  next: FileTypeFilterValue,
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

interface UseMediaTypeFilterProps {
  mediaTypeKey?: string;
}

export function useMediaTypeFilter({
  mediaTypeKey = "mediaType",
}: UseMediaTypeFilterProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 現在選択されている値の配列
  const value = useMemo<FileTypeFilterValue>(() => {
    const raw = searchParams.get(mediaTypeKey);
    if (!raw) return { types: [] };

    return parseMediaTypeFilterValues(raw);
  }, [searchParams, mediaTypeKey]);

  const apply = useCallback(
    (next: FileTypeFilterValue) => {
      const params = new URLSearchParams(searchParams.toString());
      buildParams(params, next, {
        mediaTypeKey,
      });
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams, mediaTypeKey]
  );

  const toggle = useCallback(
    (type: MediaFsNodeType) => {
      const isExist = value.types.includes(type);
      const nextTypes = isExist
        ? value.types.filter((t) => t !== type)
        : [...value.types, type];
      apply({ types: nextTypes });
    },
    [apply, value.types]
  );

  const reset = useCallback(() => apply({ types: [] }), [apply]);

  const isActive = value.types.length > 0;

  return { value, apply, toggle, reset, isActive };
}
