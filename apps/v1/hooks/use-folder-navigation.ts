"use client";

import { resolveClientPath } from "@/lib/path/resolvers";
import { IndexLike } from "@/lib/query/types";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

type Options = {
  atKey?: string; // デフォルト: "at"
};

type NavigateOptions = {
  deleted?: boolean;
  newTab?: boolean;
  at?: IndexLike; // ビューア用
};

export function useFolderNavigation(options?: Options) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // キー名とデフォルト値の設定
  const { atKey = "at" } = options || {};

  // フォルダに移動
  const navigate = useCallback(
    (path: string, options?: NavigateOptions) => {
      const basePath =
        resolveClientPath(path, { isDeleted: options?.deleted }) || path;

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
