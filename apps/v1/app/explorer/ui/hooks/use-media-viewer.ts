"use client";

import { MediaFsNode } from "@/app/lib/media/types";
import { useCallback, useMemo, useState } from "react";

/**
 * メディアビューアの状態とナビゲーションロジックを提供するカスタムフック
 * @param currentNodeList 現在のディレクトリ内の MediaFsNode リスト
 */
export const useMediaViewer = (currentNodeList: MediaFsNode[]) => {
  // ビューアの開閉状態と現在表示中のファイルパス
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState<string | null>(null);

  // ----------------------------------------------------
  // ナビゲーション用ファイルリストの準備
  // ----------------------------------------------------
  // ディレクトリを除外し、メディアファイルのみのリストを作成
  const mediaNodes = useMemo(
    () => currentNodeList.filter((node) => !node.isDirectory),
    [currentNodeList]
  );

  // 現在開いているファイルのインデックスを取得
  const currentIndex = useMemo(() => {
    if (!currentPath) return -1;
    return mediaNodes.findIndex((node) => node.path === currentPath); // TODO: これは遅いので Set を使う
  }, [currentPath, mediaNodes]);

  // ----------------------------------------------------
  // アクション関数
  // ----------------------------------------------------

  // ビューアを起動する
  const openViewer = useCallback((media: MediaFsNode) => {
    setViewerOpen(true);
    setCurrentPath(media.path);
  }, []);

  // ビューアを閉じる
  const closeViewer = useCallback(() => {
    setViewerOpen(false);
    setCurrentPath(null);
  }, []);

  // 次のファイルへ移動
  const goToNext = useCallback(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < mediaNodes.length) {
      setCurrentPath(mediaNodes[nextIndex].path);
    }
  }, [currentIndex, mediaNodes]);

  // 前のファイルへ移動
  const goToPrev = useCallback(() => {
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      setCurrentPath(mediaNodes[prevIndex].path);
    }
  }, [currentIndex, mediaNodes]);

  // 現在のメディアノード情報とパス、ナビゲーションの可否
  const currentMediaNode = mediaNodes[currentIndex] || null;
  const hasNext = currentIndex < mediaNodes.length - 1;
  const hasPrev = currentIndex > 0;
  const currentFilePath = currentPath ? `/api/media/${currentPath}` : null;

  return {
    viewerOpen,
    currentPath,
    currentFilePath,
    currentMediaNode,
    hasNext,
    hasPrev,
    openViewer,
    closeViewer,
    goToNext,
    goToPrev,
  };
};
