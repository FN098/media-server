import { visitFolderAction } from "@/actions/folder-actions";
import { ExplorerFiltering } from "@/components/ui/pages/hooks/use-explorer-filtering";
import { ExplorerSelection } from "@/components/ui/pages/hooks/use-explorer-selection";
import { useFolderNavigation } from "@/hooks/use-folder-navigation";
import { toHistoryItem } from "@/hooks/use-history";
import { useMediaIndex } from "@/hooks/use-media-index";
import { useParentPathname } from "@/hooks/use-parent-pathname";
import { useViewerNavigation } from "@/hooks/use-viewer-control";
import { IndexLike } from "@/lib/index-like";
import { isMedia } from "@/lib/media/media-types";
import { MediaListing, MediaNode } from "@/lib/media/types";
import { useHistoryContext } from "@/providers/history-provider";
import { useCallback, useEffect } from "react";
import { toast } from "sonner";

interface UseExplorerNavigationProps {
  listing: MediaListing;
  filtering: ExplorerFiltering;
  selection: ExplorerSelection;
}

export function useExplorerNavigation({
  listing,
  filtering,
  selection,
}: UseExplorerNavigationProps) {
  const { path: currentDir, next: nextDir, prev: prevDir } = listing;
  const { filteredNodes, mediaOnly } = filtering;

  // ===== 訪問履歴 =====

  const history = useHistoryContext();

  // 初回マウント時に訪問履歴にプッシュ
  useEffect(() => {
    history.push({ path: currentDir, type: "directory" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // スクロール完了時に訪問履歴をポップ
  const handleScrollRestored = () => {
    history.pop();
  };

  // フォルダ訪問履歴自動更新
  useEffect(() => {
    if (currentDir) {
      void visitFolderAction(currentDir);
    }
  }, [currentDir]);

  // ===== ビューア =====

  const viewer = useViewerNavigation({ nodes: filteredNodes });

  // ビューアスライド移動時の処理
  const handleIndexChange = useCallback(
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

  // ===== ナビゲーション =====

  const folder = useFolderNavigation({});

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
    isViewerOpen: viewer.isOpen,
    closeViewer: viewer.close,
    initialIndex: viewer.index,
    lastHistory: history.last,
    handleScrollRestored,
    handleIndexChange,
  };
}
