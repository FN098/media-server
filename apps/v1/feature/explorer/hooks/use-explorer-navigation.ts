import { ExplorerDialogs } from "@/feature/explorer/hooks/use-explorer-dialogs";
import { ExplorerFiltering } from "@/feature/explorer/hooks/use-explorer-filtering";
import { visitFolderAction } from "@/feature/folder/actions/visit";
import { History, toHistoryItem } from "@/feature/history/hooks/use-history";
import { FolderNavigation } from "@/feature/navigation/hooks/use-folder-navigation";
import { useParentPathname } from "@/feature/navigation/hooks/use-parent-pathname";
import { MediaNodeSelection } from "@/feature/selection/hooks/use-media-node-selection";
import { readFileAsTextAction } from "@/feature/text-file-reader/actions/read-as-text";
import { useMediaIndex } from "@/feature/viewer/hooks/use-media-index";
import {
  IndexLike,
  ViewerNavigation,
} from "@/feature/viewer/hooks/use-viewer-navigation";
import { isArchiveFile } from "@/lib/archive/guards";
import { isMedia } from "@/lib/media/detectors";
import { MediaListing, MediaNode } from "@/lib/media/types";
import { useCallback, useEffect } from "react";
import { toast } from "sonner";

interface UseExplorerNavigationProps {
  listing: MediaListing;
  filtering: ExplorerFiltering;
  selection: MediaNodeSelection;
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
    async (node: MediaNode) => {
      // フォルダ
      if (node.isDirectory) {
        folder.navigate({ path: node.path, resetPage: true });
        return;
      }

      // ファイル（動画・画像・オーディオ）
      if (isMedia(node.type)) {
        const index = getMediaIndex(node.path);
        if (index == null) return;
        viewer.open({ at: index });
        return;
      }

      // ファイル（アーカイブ）
      if (isArchiveFile(node.path)) {
        dialogs.extractDialog.open([node]);
        return;
      }

      // ファイル（テキスト）
      const text = await readFileAsTextAction({ path: node.path });
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
      getMediaIndex,
      viewer,
    ]
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

  // 前のフォルダを開く
  const openPrevFolder = useCallback(
    (at: IndexLike = "last") => {
      if (prevDir) {
        folder.navigate({ path: prevDir, at });
      }
    },
    [folder, prevDir]
  );

  // 次のフォルダを開く
  const openNextFolder = useCallback(
    (at: IndexLike = "first") => {
      if (nextDir) {
        folder.navigate({ path: nextDir, at });
      }
    },
    [folder, nextDir]
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
