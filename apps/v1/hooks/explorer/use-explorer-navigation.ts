import { getTextFilePreviewAction } from "@/actions/file/get-text-preview";
import { visitFolderAction } from "@/actions/folder/visit";
import { ExplorerDialogs } from "@/hooks/explorer/use-explorer-dialogs";
import { ExplorerFiltering } from "@/hooks/explorer/use-explorer-filtering";
import { FolderNavigation } from "@/hooks/navigation/use-folder-navigation";
import { History, toHistoryItem } from "@/hooks/navigation/use-history";
import { useMediaIndex } from "@/hooks/navigation/use-media-index";
import { useParentPathname } from "@/hooks/navigation/use-parent-pathname";
import {
  IndexLike,
  ViewerNavigation,
} from "@/hooks/navigation/use-viewer-navigation";
import { MediaNodeSelection } from "@/hooks/selections/use-media-node-selection";
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
      void visitFolderAction(currentDir);
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
        folder.navigate({ path: node.path, resetPage: true });
        return;
      }

      if (isMedia(node.type)) {
        const index = getMediaIndex(node.path);
        if (index == null) return;
        viewer.open({ at: index });
        return;
      }

      // テキストファイルならプレビュー表示
      toast.promise(
        async () => {
          const file = await getTextFilePreviewAction(node.path);

          if (!file.isText)
            throw new Error("このファイル形式は対応していません");

          if (!file.content) throw new Error("空のファイルです");

          dialogs.textFilePreviewDialog.open({
            title: node.name,
            content: file.content,
            encoding: file.encoding,
            isTruncated: file.isTruncated,
          });
        },
        {
          loading: "読み込み中...",
          success: "読み込み完了",
          error: (e) =>
            (e as Error).message || "ファイルの読み込みに失敗しました",
        }
      );
    },
    [dialogs.textFilePreviewDialog, folder, getMediaIndex, viewer]
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
