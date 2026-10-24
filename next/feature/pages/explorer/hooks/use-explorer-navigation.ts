import { visitFolderAction } from "@/feature/folder/actions/visit";
import { History, toHistoryItem } from "@/feature/history/hooks/use-history";
import { FolderNavigation } from "@/feature/navigation/hooks/use-folder-navigation";
import { useParentPathname } from "@/feature/navigation/hooks/use-parent-pathname";
import { ExplorerDialogs } from "@/feature/pages/explorer/hooks/use-explorer-dialogs";
import { ExplorerFiltering } from "@/feature/pages/explorer/hooks/use-explorer-filtering";
import { NodeSelectionControl } from "@/feature/selection/hooks/use-node-selection-control";
import { readFileAsTextAction } from "@/feature/text-file-reader/actions/read-as-text";
import { useNodeIndex } from "@/feature/viewers/media-viewer/hooks/use-media-index";
import {
  IndexLike,
  ViewerNavigation,
} from "@/feature/viewers/media-viewer/hooks/use-viewer-navigation";
import { isArchiveFile } from "@/lib/archive/archive-types";
import { isMediaFile } from "@/lib/node/media-types";
import { Node, NodeListing } from "@/lib/node/types";
import { useCallback, useEffect } from "react";
import { toast } from "sonner";

interface UseExplorerNavigationProps {
  listing: NodeListing;
  filtering: ExplorerFiltering;
  selection: NodeSelectionControl;
  viewer: ViewerNavigation;
  history: History;
  folder: FolderNavigation;
  dialogs: ExplorerDialogs;
}

export function useExplorerNavigation({
  listing,
  filtering,
  selection,
  viewer,
  history,
  folder,
  dialogs,
}: UseExplorerNavigationProps) {
  const { currentFolder, prevFolder, nextFolder } = listing;
  const { mediaOnly } = filtering;

  // 初回マウント時に訪問履歴にプッシュ
  useEffect(() => {
    history.push({ key: currentFolder.id, type: "folder" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // スクロール完了時に訪問履歴をポップ
  const onScrollRestored = () => {
    history.pop();
  };

  // フォルダ訪問履歴自動更新
  useEffect(() => {
    if (currentFolder) {
      void visitFolderAction({ folderId: currentFolder.id });
    }
  }, [currentFolder]);

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
  const { getNodeIndex } = useNodeIndex(mediaOnly);

  // ファイル/フォルダオープン
  const open = useCallback(
    async (node: Node) => {
      // フォルダ
      if (node.isDirectory) {
        folder.navigate({ folderId: currentFolder.id, resetPage: true });
        return;
      }

      // ファイル（動画・画像・オーディオ）
      if (isMediaFile(node.type)) {
        const index = getNodeIndex(node.id);
        if (index == null) return;
        viewer.open({ at: index });
        return;
      }

      // ファイル（アーカイブ）
      if (isArchiveFile(node.type)) {
        dialogs.extractDialog.open([{ fileId: node.id, name: node.name }]);
        return;
      }

      // ファイル（テキスト）
      const text = await readFileAsTextAction({ fileId: node.id });
      if (!text.success) {
        toast.error(text.message);
        return;
      }

      dialogs.textFilePreviewDialog.open({
        title: node.name,
        content: text.content,
        encoding: text.encoding,
        isTruncated: text.isTruncated,
      });
    },
    [
      dialogs.extractDialog,
      dialogs.textFilePreviewDialog,
      folder,
      getNodeIndex,
      viewer,
    ]
  );

  // 新しいタブで開く
  const openInNewTab = useCallback(
    (node: Node) => {
      if (node.isDirectory) {
        folder.navigate({ folderId: node.id, newTab: true });
        return;
      }

      if (isMediaFile(node.type)) {
        const index = getNodeIndex(node.id);
        if (index == null) return;
        viewer.open({ at: index, newTab: true });
        return;
      }

      toast.warning("このファイル形式は対応していません");
    },
    [folder, getNodeIndex, viewer]
  );

  // 前のフォルダを開く
  const openPrevFolder = useCallback(
    (at: IndexLike = "last") => {
      if (prevFolder) {
        folder.navigate({ folderId: prevFolder.id, at });
      }
    },
    [folder, prevFolder]
  );

  // 次のフォルダを開く
  const openNextFolder = useCallback(
    (at: IndexLike = "first") => {
      if (nextFolder) {
        folder.navigate({ folderId: nextFolder.id, at });
      }
    },
    [folder, nextFolder]
  );

  // 一つ上のフォルダを開く
  const { navigateToParent: openParentFolder } = useParentPathname();

  return {
    open,
    openInNewTab,
    openPrevFolder,
    openNextFolder,
    openParentFolder,
    onScrollRestored,
    onIndexChange,
  };
}

export type ExplorerNavigation = ReturnType<typeof useExplorerNavigation>;
