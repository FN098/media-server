import { IndexLike, parseIndexLike } from "@/lib/index-like";
import { MediaNode } from "@/lib/media/types";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

export type ViewerNavigation = ReturnType<typeof useViewerNavigation>;

type OpenOptions = {
  at?: IndexLike;
  newTab?: boolean;
};

interface UesViewerNavigationProps {
  nodes: MediaNode[];
  atKey?: string;
  modalKey?: string;
}

export function useViewerNavigation({
  nodes,
  atKey = "at",
  modalKey = "modal",
}: UesViewerNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 現在の値をURLから取得
  const at = searchParams.get(atKey) as IndexLike;
  const modal = searchParams.get(modalKey);

  // number に正規化されたインデックス
  const index = useMemo(
    () => parseIndexLike(at, nodes.length),
    [at, nodes.length]
  );

  // ビューアを起動
  const open = useCallback(
    (options?: OpenOptions) => {
      const { at = 0, newTab = false } = options ?? {};
      const params = new URLSearchParams(searchParams.toString());

      params.set(modalKey, "true");
      params.set(atKey, String(at));

      if (newTab) {
        window.open(`${pathname}?${params.toString()}`, "_blank", "noreferrer");
      } else {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      }
    },
    [atKey, modalKey, pathname, router, searchParams]
  );

  // ビューアを閉じる
  const close = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());

    params.delete(modalKey);
    params.delete(atKey);

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [atKey, modalKey, pathname, router, searchParams]);

  return {
    index,
    isOpen: !!modal,
    open,
    close,
  };
}
