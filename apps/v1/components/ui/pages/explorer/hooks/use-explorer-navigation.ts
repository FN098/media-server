import { ExplorerFiltering } from "@/components/ui/pages/explorer/hooks/use-explorer-filtering";
import { ExplorerSelection } from "@/components/ui/pages/explorer/hooks/use-explorer-selection";
import { FolderNavigation } from "@/hooks/navigations/use-folder-navigation";
import { History, toHistoryItem } from "@/hooks/navigations/use-history";
import { useMediaIndex } from "@/hooks/navigations/use-media-index";
import { useParentPathname } from "@/hooks/navigations/use-parent-pathname";
import {
  IndexLike,
  ViewerNavigation,
} from "@/hooks/navigations/use-viewer-navigation";
import { visitFolderAction } from "@/lib/folder/actions";
import { isMedia } from "@/lib/media/detectors";
import { MediaListing, MediaNode } from "@/lib/media/types";
import { getFilePreviewAction } from "@/lib/text/actions";
import { useCallback, useEffect } from "react";
import { toast } from "sonner";

export type ExplorerNavigation = ReturnType<typeof useExplorerNavigation>;

interface UseExplorerNavigationProps {
  listing: MediaListing;
  filtering: ExplorerFiltering;
  selection: ExplorerSelection;
  viewer: ViewerNavigation;
  history: History;
  folder: FolderNavigation;
}

export function useExplorerNavigation({
  listing,
  filtering,
  selection,
  viewer,
  history,
  folder,
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

      toast.promise(
        async () => {
          return await getFilePreviewAction(node.path);
        },
        {
          loading: "読み込み中...",
          success: (file) => {
            if (file.isText) {
              return file.content;
            }
            return "このファイル形式は対応していません";
          },
          error: "ファイルの読み込みに失敗しました",
        }
      );
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
