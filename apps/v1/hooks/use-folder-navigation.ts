"use client";

import { encodePath } from "@/lib/path/encoder";
import { getClientExplorerPath, getClientTrashPath } from "@/lib/path/helpers";
import { IndexLike } from "@/lib/query/types";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export interface UseFolderNavigationOptions {
  atKey?: string; // デフォルト: "at"
}

type FolderNavigateOptions = {
  deleted?: boolean;
  newTab?: boolean;
  at?: IndexLike; // ビューア用
};

function resolveClientPath(path: string, options?: FolderNavigateOptions) {
  const encoded = encodePath(path);

  // 削除済み
  if (options?.deleted) return getClientTrashPath(encoded);

  return getClientExplorerPath(encoded);
}

export function useFolderNavigation(options?: UseFolderNavigationOptions) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // キー名とデフォルト値の設定
  const { atKey = "at" } = options || {};

  // フォルダに移動
  const navigate = useCallback(
    (path: string, options?: FolderNavigateOptions) => {
      const basePath = resolveClientPath(path, options) || path;
      const params = new URLSearchParams(searchParams.toString());

      if (options?.at) {
        params.set(atKey, String(options.at));
      }

      if (options?.newTab) {
        window.open(`${basePath}?${params.toString()}`, "_blank", "noreferrer");
      } else {
        router.push(`${basePath}?${params.toString()}`, { scroll: false });
      }
    },
    [atKey, router, searchParams]
  );

  return {
    navigate,
  };
}
