"use client";

import { isMedia } from "@/app/lib/media";
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
    () => currentNodeList.filter((node) => isMedia(node)),
    [currentNodeList]
  );

  // path → index のマップを作成（O(1) lookup 用）
  const pathIndexMap = useMemo(() => {
    const map = new Map<string, number>();
    mediaNodes.forEach((node, idx) => {
      map.set(node.path, idx);
    });
    return map;
  }, [mediaNodes]);

  // 現在開いているファイルのインデックスを取得
  const currentIndex = useMemo(() => {
    if (!currentPath) return -1;
    return pathIndexMap.get(currentPath) ?? -1;
  }, [currentPath, pathIndexMap]);

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
    if (currentIndex >= mediaNodes.length - 1) return;
    const nextIndex = currentIndex + 1;
    setCurrentPath(mediaNodes[nextIndex].path);
  }, [currentIndex, mediaNodes]);

  // 前のファイルへ移動
  const goToPrev = useCallback(() => {
    if (currentIndex <= 0) return;
    const prevIndex = currentIndex - 1;
    setCurrentPath(mediaNodes[prevIndex].path);
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
