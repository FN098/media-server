import { FavoritesFiltering } from "@/components/ui/pages/favorites/hooks/use-favorites-filtering";
import { FavoritesSelection } from "@/components/ui/pages/favorites/hooks/use-favorites-selection";
import { FolderNavigation } from "@/hooks/navigations/use-folder-navigation";
import { History, toHistoryItem } from "@/hooks/navigations/use-history";
import { useMediaIndex } from "@/hooks/navigations/use-media-index";
import { ViewerNavigation } from "@/hooks/navigations/use-viewer-navigation";
import { isMedia } from "@/lib/media/detectors";
import { MediaNode } from "@/lib/media/types";
import { getParentDirPath } from "@/lib/path/helpers";
import { useCallback } from "react";
import { toast } from "sonner";

export type FavoritesNavigation = ReturnType<typeof useFavoritesNavigation>;

interface UseFavoritesNavigationProps {
  filtering: FavoritesFiltering;
  selection: FavoritesSelection;
  viewer: ViewerNavigation;
  history: History;
  folder: FolderNavigation;
}

export function useFavoritesNavigation({
  filtering,
  selection,
  viewer,
  history,
  folder,
}: UseFavoritesNavigationProps) {
  const { mediaOnly } = filtering;

  // スクロール完了時に訪問履歴をポップ
  const onScrollRestored = () => {
    history.pop();
  };

  // ビューアスライド移動時の処理
  const onIndexChange = useCallback(
    (index: number) => {
      const media = mediaOnly[index];
      if (!media) return;

      selection.replace(media);

      if (history.last?.type === "file") {
        history.replaceLast(toHistoryItem(media));
      } else {
        history.push(toHistoryItem(media));
      }
    },
    [history, mediaOnly, selection]
  );

  // インデックス計算
  const { getMediaIndex } = useMediaIndex(mediaOnly);

  // ファイル/フォルダオープン
  const open = useCallback(
    (node: MediaNode) => {
      if (node.isDirectory) {
        folder.navigate({ path: node.path, resetPage: true });
        return;
      }

      if (isMedia(node.type)) {
        const index = getMediaIndex(node.path);
        if (index == null) return;
        viewer.open({ at: index });
        return;
      }

      toast.warning("このファイル形式は対応していません");
    },
    [folder, getMediaIndex, viewer]
  );

  // 新しいタブで開く
  const openInNewTab = useCallback(
    (node: MediaNode) => {
      if (node.isDirectory) {
        folder.navigate({ path: node.path, newTab: true });
        return;
      }

      if (isMedia(node.type)) {
        const index = getMediaIndex(node.path);
        if (index == null) return;
        viewer.open({ at: index, newTab: true });
        return;
      }

      toast.warning("このファイル形式は対応していません");
    },
    [folder, getMediaIndex, viewer]
  );

  // 親フォルダを開く
  const openParentFolder = (node: MediaNode) => {
    const path = getParentDirPath(node.path);
    folder.navigate({ path, at: null });
  };

  return {
    open,
    openInNewTab,
    onScrollRestored,
    onIndexChange,
    openParentFolder,
  };
}
