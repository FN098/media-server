import { visitFolderAction } from "@/feature/folder/actions/visit";
import { History, toHistoryItem } from "@/feature/history/hooks/use-history";
import { FolderNavigation } from "@/feature/navigation/hooks/use-folder-navigation";
import { useParentPathname } from "@/feature/navigation/hooks/use-parent-pathname";
import { TrashFiltering } from "@/feature/pages/trash/hooks/use-trash-filtering";
import { MediaNodeSelection } from "@/feature/selection/hooks/use-media-node-selection";
import { useMediaIndex } from "@/feature/viewers/media-viewer/hooks/use-media-index";
import {
  IndexLike,
  ViewerNavigation,
} from "@/feature/viewers/media-viewer/hooks/use-viewer-navigation";
import { isMedia } from "@/lib/media/detectors";
import { MediaListing, MediaNode } from "@/lib/media/types";
import { useCallback, useEffect } from "react";
import { toast } from "sonner";

interface UseTrashNavigationProps {
  listing: MediaListing;
  filtering: TrashFiltering;
  selection: MediaNodeSelection;
  viewer: ViewerNavigation;
  history: History;
  folder: FolderNavigation;
}

export function useTrashNavigation({
  listing,
  filtering,
  selection,
  viewer,
  history,
  folder,
}: UseTrashNavigationProps) {
  const { path: currentDir, next: nextDir, prev: prevDir } = listing;
  const { mediaOnly } = filtering;

  // 初回マウント時に訪問履歴にプッシュ
  useEffect(() => {
    history.push({ path: currentDir, type: "directory" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // スクロール完了時に訪問履歴をポップ
  const onScrollRestored = () => {
    history.pop();
  };

  // フォルダ訪問履歴自動更新
  useEffect(() => {
    if (currentDir) {
      void visitFolderAction({ dirPath: currentDir });
    }
  }, [currentDir]);

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
        folder.navigate({ path: node.path, resetPage: true, deleted: true });
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
        folder.navigate({ path: node.path, newTab: true, deleted: true });
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

  // 前のフォルダを開く
  const openPrevFolder = useCallback(
    (at: IndexLike = "last") => {
      if (prevDir) {
        folder.navigate({ path: prevDir, at, deleted: true });
      }
    },
    [folder, prevDir]
  );

  // 次のフォルダを開く
  const openNextFolder = useCallback(
    (at: IndexLike = "first") => {
      if (nextDir) {
        folder.navigate({ path: nextDir, at, deleted: true });
      }
    },
    [folder, nextDir]
  );

  // 一つ上のフォルダを開く
  const { navigateToParent } = useParentPathname();

  return {
    open,
    openInNewTab,
    openPrevFolder,
    openNextFolder,
    openParentFolder: navigateToParent,
    onScrollRestored,
    onIndexChange,
  };
}

export type TrashNavigation = ReturnType<typeof useTrashNavigation>;
