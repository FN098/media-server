import { IndexLike } from "@/feature/viewers/media-viewer/hooks/use-viewer-navigation";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

type NavigateConfig = {
  folderId: string;
  newTab?: boolean; // 新しいタブで開く
  at?: IndexLike | null; // ビューア用
  resetPage?: boolean; // 画面遷移時にページリセット
};

interface UseFolderNavigationProps {
  atKey?: string;
  pageKey?: string;
  baseUrl?: string;
}

export function useFolderNavigation({
  atKey = "at",
  pageKey = "page",
  baseUrl = "/explorer",
}: UseFolderNavigationProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const buildUrl = useCallback(
    (config: NavigateConfig) => {
      const { folderId, at, resetPage } = config;
      const params = new URLSearchParams(searchParams.toString());

      if (at) {
        params.set(atKey, String(at));
      } else if (at === null) {
        params.delete(atKey);
      }

      if (resetPage) {
        params.delete(pageKey);
      }

      return `${baseUrl}/${folderId}?${params.toString()}`;
    },
    [atKey, pageKey, router, searchParams]
  );

  // フォルダに移動
  const navigate = useCallback(
    (config: NavigateConfig) => {
      const { newTab } = config;
      const url = buildUrl(config);

      if (newTab) {
        window.open(url, "_blank", "noreferrer");
      } else {
        router.push(url, {
          scroll: false,
        });
      }
    },
    [atKey, pageKey, router, searchParams]
  );

  return {
    navigate,
  };
}

export type FolderNavigation = ReturnType<typeof useFolderNavigation>;
