"use client";

import { IndexLike } from "@/lib/index-like";
import { resolveClientPath } from "@/lib/path/resolvers";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

type Options = {
  atKey?: string; // デフォルト: "at"
};

type NavigateOptions = {
  deleted?: boolean; // 削除済みの場合は遷移先を変える
  newTab?: boolean; // 新しいタブで開く
  at?: IndexLike | null; // ビューア用
};

export function useFolderNavigation(options?: Options) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // キー名とデフォルト値の設定
  const { atKey = "at" } = options || {};

  // フォルダに移動
  const navigate = useCallback(
    (path: string, options?: NavigateOptions) => {
      const { deleted, at, newTab } = options || {};
      const basePath = resolveClientPath(path, { isDeleted: deleted }) || path;
      const params = new URLSearchParams(searchParams.toString());

      if (at) {
        params.set(atKey, String(at));
      } else if (at === null) {
        params.delete(atKey);
      }

      if (newTab) {
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
