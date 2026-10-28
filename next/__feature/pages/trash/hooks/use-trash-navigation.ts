import { visitFolderAction } from "@/__feature/folder/actions/visit";
import { FolderNavigation } from "@/__feature/navigation/hooks/use-folder-navigation";
import { useParentPathname } from "@/__feature/navigation/hooks/use-parent-pathname";
import { TrashFiltering } from "@/__feature/pages/trash/hooks/use-trash-filtering";
import { useNodeIndex } from "@/__feature/viewers/media-viewer/hooks/use-media-index";
import { History, toHistoryItem } from "@/feature/history/hooks/use-history";
import { NodeSelection } from "@/feature/selection/hooks/use-node-selection";
import { IndexLike, ViewerNavigation } from "@/feature/viewer/hooks/use-viewer";
import { isMediaFile } from "@/lib/file/media-types";
import { MediaListing, MediaNode } from "@/lib/node/types";
import { useCallback, useEffect } from "react";
import { toast } from "sonner";

interface UseTrashNavigationProps {
  listing: MediaListing;
  filtering: TrashFiltering;
  selection: NodeSelection;
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
    history.push({ key: currentDir, type: "directory" });
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
  const { getNodeIndex: getMediaIndex } = useNodeIndex(mediaOnly);

  // ファイル/フォルダオープン
  const open = useCallback(
    (node: MediaNode) => {
      if (node.isDirectory) {
        folder.navigate({
          folderId: node.path,
          resetPage: true,
          deleted: true,
        });
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
        folder.navigate({ folderId: node.path, newTab: true, deleted: true });
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

  // 前のフォルダを開く
  const openPrevFolder = useCallback(
    (at: IndexLike = "last") => {
      if (prevDir) {
        folder.navigate({ folderId: prevDir, at, deleted: true });
      }
    },
    [folder, prevDir]
  );

  // 次のフォルダを開く
  const openNextFolder = useCallback(
    (at: IndexLike = "first") => {
      if (nextDir) {
        folder.navigate({ folderId: nextDir, at, deleted: true });
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
