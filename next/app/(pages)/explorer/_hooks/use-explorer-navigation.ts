import { visitFolderAction } from "@/__feature/folder/actions/visit";
import { useParentPathname } from "@/__feature/navigation/hooks/use-parent-pathname";
import { readFileAsTextAction } from "@/__feature/text-file-reader/actions/read-as-text";
import { useNodeIndex } from "@/__feature/viewers/media-viewer/hooks/use-media-index";
import { isArchiveFile } from "@/__lib/archive/archive-types";
import { useExplorerDialogs } from "@/app/(pages)/explorer/_hooks/use-explorer-dialogs";
import { useExplorerFiltering } from "@/app/(pages)/explorer/_hooks/use-explorer-filtering";
import { useExplorerSelection } from "@/app/(pages)/explorer/_hooks/use-explorer-selection";
import { useFolderNavigation } from "@/feature/folder-navigation/hooks/use-folder-navigation";
import { toHistoryItem } from "@/feature/history/hooks/use-history";
import { useHistoryContext } from "@/feature/history/providers/history-provider";
import { useNodeListingContext } from "@/feature/listing/providers/node-listing-provider";
import { IndexLike } from "@/feature/viewer/hooks/use-viewer";
import { useViewerContext } from "@/feature/viewer/providers/viewer-provider";
import { isMediaFile } from "@/lib/file/media-types";
import { Node } from "@/lib/node/types";
import { useCallback, useEffect } from "react";
import { toast } from "sonner";

export function useExplorerNavigation() {
  const { currentFolder, prevFolder, nextFolder } = useNodeListingContext();
  const { mediaOnly } = useExplorerFiltering();
  const { open: openViewer } = useViewerContext();
  const { navigate: openFolder } = useFolderNavigation();
  const { replace: replaceSelection } = useExplorerSelection();
  const { extractDialog, textFilePreviewDialog } = useExplorerDialogs();
  const history = useHistoryContext();

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

      replaceSelection(media);

      if (history.last?.type === "file") {
        history.replaceLast(toHistoryItem(media));
      } else {
        history.push(toHistoryItem(media));
      }
    },
    [history, mediaOnly, replaceSelection]
  );

  // インデックス計算
  const { getNodeIndex } = useNodeIndex(mediaOnly);

  // ファイル/フォルダオープン
  const open = useCallback(
    async (node: Node) => {
      // フォルダ
      if (node.isDirectory) {
        openFolder({ folderId: currentFolder.id, resetPage: true });
        return;
      }

      // ファイル（動画・画像・オーディオ）
      if (isMediaFile(node.type)) {
        const index = getNodeIndex(node.id);
        if (index == null) return;
        openViewer({ at: index });
        return;
      }

      // ファイル（アーカイブ）
      if (isArchiveFile(node.type)) {
        extractDialog.open([{ fileId: node.id, name: node.name }]);
        return;
      }

      // ファイル（テキスト）
      const text = await readFileAsTextAction({ fileId: node.id });
      if (!text.success) {
        toast.error(text.message);
        return;
      }

      textFilePreviewDialog.open({
        title: node.name,
        content: text.content,
        encoding: text.encoding,
        isTruncated: text.isTruncated,
      });
    },
    [extractDialog, textFilePreviewDialog, openFolder, getNodeIndex, openViewer]
  );

  // 新しいタブで開く
  const openInNewTab = useCallback(
    (node: Node) => {
      if (node.isDirectory) {
        openFolder({ folderId: node.id, newTab: true });
        return;
      }

      if (isMediaFile(node.type)) {
        const index = getNodeIndex(node.id);
        if (index == null) return;
        openViewer({ at: index, newTab: true });
        return;
      }

      toast.warning("このファイル形式は対応していません");
    },
    [openFolder, getNodeIndex, openViewer]
  );

  // 前のフォルダを開く
  const openPrevFolder = useCallback(
    (at: IndexLike = "last") => {
      if (prevFolder) {
        openFolder({ folderId: prevFolder.id, at });
      }
    },
    [openFolder, prevFolder]
  );

  // 次のフォルダを開く
  const openNextFolder = useCallback(
    (at: IndexLike = "first") => {
      if (nextFolder) {
        openFolder({ folderId: nextFolder.id, at });
      }
    },
    [openFolder, nextFolder]
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
