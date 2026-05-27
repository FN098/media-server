import { IndexLike } from "@/lib/index-like";
import { resolveClientPath } from "@/lib/path/resolvers";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export type FolderNavigation = ReturnType<typeof useFolderNavigation>;

type NavigateConfig = {
  path: string;
  deleted?: boolean; // 削除済みの場合は遷移先を変える
  newTab?: boolean; // 新しいタブで開く
  at?: IndexLike | null; // ビューア用
  resetPage?: boolean; // 画面遷移時にページリセット
};

interface UseFolderNavigationProps {
  atKey?: string; // デフォルト: "at"
  pageKey?: string; // デフォルト: "page"
}

export function useFolderNavigation({
  atKey = "at",
  pageKey = "page",
}: UseFolderNavigationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // フォルダに移動
  const navigate = useCallback(
    ({ path, deleted, at, newTab, resetPage }: NavigateConfig) => {
      const basePath = resolveClientPath(path, { isDeleted: deleted }) || path;
      const params = new URLSearchParams(searchParams.toString());

      if (at) {
        params.set(atKey, String(at));
      } else if (at === null) {
        params.delete(atKey);
      }

      if (resetPage) {
        params.delete(pageKey);
      }

      if (newTab) {
        window.open(`${basePath}?${params.toString()}`, "_blank", "noreferrer");
      } else {
        router.push(`${basePath}?${params.toString()}`, { scroll: false });
      }
    },
    [atKey, pageKey, router, searchParams]
  );

  return {
    navigate,
  };
}
