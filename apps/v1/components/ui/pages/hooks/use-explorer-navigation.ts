import { visitFolderAction } from "@/actions/folder-actions";
import { useFolderNavigation } from "@/hooks/use-folder-navigation";
import { toHistoryItem } from "@/hooks/use-history";
import { useMediaIndex } from "@/hooks/use-media-index";
import { useParentPathname } from "@/hooks/use-parent-pathname";
import { useViewerNavigation } from "@/hooks/use-viewer-control";
import { IndexLike } from "@/lib/index-like";
import { isMedia } from "@/lib/media/media-types";
import { MediaNode } from "@/lib/media/types";
import { useHistoryContext } from "@/providers/history-provider";
import { useEffect } from "react";
import { toast } from "sonner";

interface UseExplorerNavigationProps {
  currentDir: string;
  prevDir: string | null;
  nextDir: string | null;
  mediaOnly: MediaNode[];
  onSelect: (node: MediaNode) => void;
}

export function useExplorerNavigation({
  currentDir,
  prevDir,
  nextDir,
  mediaOnly,
  onSelect,
}: UseExplorerNavigationProps) {
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

  const viewer = useViewerNavigation({ nodes: mediaOnly });

  // ビューアスライド移動時の処理
  const handleIndexChange = (index: number) => {
    const media = mediaOnly[index];
    if (!media) return;

    onSelect(media);

    if (history.last?.type === "file") {
      history.replaceLast(toHistoryItem(media));
    } else {
      history.push(toHistoryItem(media));
    }
  };

  // ===== ナビゲーション =====

  const folder = useFolderNavigation();

  // インデックス計算
  const { getMediaIndex } = useMediaIndex(mediaOnly);

  // ファイル/フォルダオープン
  const open = (node: MediaNode) => {
    if (node.isDirectory) {
      folder.navigate(node.path, { resetPage: true });
      return;
    }

    if (isMedia(node.type)) {
      const index = getMediaIndex(node.path);
      if (index == null) return;
      viewer.open({ at: index });
      return;
    }

    toast.warning("このファイル形式は対応していません");
  };

  // 新しいタブで開く
  const openInNewTab = (node: MediaNode) => {
    if (node.isDirectory) {
      folder.navigate(node.path, { newTab: true });
      return;
    }

    if (isMedia(node.type)) {
      const index = getMediaIndex(node.path);
      if (index == null) return;
      viewer.open({ at: index, newTab: true });
      return;
    }

    toast.warning("このファイル形式は対応していません");
  };

  // 前のフォルダを開く
  const openPrevFolder = (at: IndexLike = "last") => {
    if (prevDir) {
      folder.navigate(prevDir, { at });
    }
  };

  // 次のフォルダを開く
  const openNextFolder = (at: IndexLike = "first") => {
    if (nextDir) {
      folder.navigate(nextDir, { at });
    }
  };

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
