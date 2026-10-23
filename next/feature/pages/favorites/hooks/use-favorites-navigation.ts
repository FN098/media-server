import { History, toHistoryItem } from "@/feature/history/hooks/use-history";
import { FolderNavigation } from "@/feature/navigation/hooks/use-folder-navigation";
import { FavoritesFiltering } from "@/feature/pages/favorites/hooks/use-favorites-filtering";
import { NodeSelectionControl } from "@/feature/selection/hooks/use-node-selection-control";
import { useNodeIndex } from "@/feature/viewers/media-viewer/hooks/use-media-index";
import { ViewerNavigation } from "@/feature/viewers/media-viewer/hooks/use-viewer-navigation";
import { isMediaFile } from "@/lib/node/media-types";
import { MediaNode } from "@/lib/node/types";
import { parentpath } from "@/lib/virtual-path/path";
import { useCallback } from "react";
import { toast } from "sonner";

interface UseFavoritesNavigationProps {
  filtering: FavoritesFiltering;
  selection: NodeSelectionControl;
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
  const { getNodeIndex: getMediaIndex } = useNodeIndex(mediaOnly);

  // ファイル/フォルダオープン
  const open = useCallback(
    (node: MediaNode) => {
      if (node.isDirectory) {
        folder.navigate({ folderId: node.path, resetPage: true });
        return;
      }

      if (isMediaFile(node.type)) {
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
        folder.navigate({ folderId: node.path, newTab: true });
        return;
      }

      if (isMediaFile(node.type)) {
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
    const parent = parentpath(node.path);
    if (parent !== null) {
      folder.navigate({ folderId: parent, at: null });
    }
  };

  return {
    open,
    openInNewTab,
    onScrollRestored,
    onIndexChange,
    openParentFolder,
  };
}

export type FavoritesNavigation = ReturnType<typeof useFavoritesNavigation>;
