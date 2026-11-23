import { FileTypeFilterValue } from "@/feature/file/lib/filter";
import { FileType, isFileType } from "@/lib/file/file-types";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

// --- URL parse helpers ---

function parseFileTypeFilterValues(raw: string | null): FileTypeFilterValue {
  if (!raw) return { types: [] };

  // カンマ区切りなどで管理する場合
  const candidates = raw.split(",");

  const types = candidates.filter((v) => isFileType(v));

  return { types };
}

// --- URL serialize helpers ---

function serializeFileTypeFilterValue(value: FileTypeFilterValue) {
  return {
    fileType: value.types.join(","),
  };
}

function buildParams(
  params: URLSearchParams,
  next: FileTypeFilterValue,
  keys: { fileTypeKey: string }
): void {
  const { fileTypeKey } = keys;
  if (next.types.length === 0) {
    params.delete(fileTypeKey);
    return;
  }
  const { fileType } = serializeFileTypeFilterValue(next);
  params.set(fileTypeKey, fileType);
}

// --- hook ---

interface UseFileTypeFilterProps {
  fileTypeKey?: string;
}

export function useFileTypeFilter({
  fileTypeKey = "fileType",
}: UseFileTypeFilterProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 現在選択されている値の配列
  const value = useMemo<FileTypeFilterValue>(() => {
    const raw = searchParams.get(fileTypeKey);
    if (!raw) return { types: [] };

    return parseFileTypeFilterValues(raw);
  }, [searchParams, fileTypeKey]);

  const apply = useCallback(
    (next: FileTypeFilterValue) => {
      const params = new URLSearchParams(searchParams.toString());
      buildParams(params, next, {
        fileTypeKey: fileTypeKey,
      });
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams, fileTypeKey]
  );

  const toggle = useCallback(
    (type: FileType) => {
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
