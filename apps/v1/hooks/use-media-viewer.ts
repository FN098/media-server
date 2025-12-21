"use client";

import { isMedia } from "@/lib/media/detector";
import { MediaFsNode } from "@/lib/media/types";
import { useCallback, useMemo, useState } from "react";

export const useMediaViewer = (mediaList: MediaFsNode[]) => {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);

  // メディアのみ抽出
  const mediaNodes = useMemo(
    () => mediaList.filter((node) => isMedia(node)),
    [mediaList]
  );

  // viewer を開く（MediaFsNode を渡す）
  const openViewerAt = useCallback(
    (media: MediaFsNode) => {
      const index = mediaNodes.findIndex((node) => node.path === media.path);
      if (index === -1) return;

      setCurrentIndex(index);
      setViewerOpen(true);
    },
    [mediaNodes]
  );

  const closeViewer = useCallback(() => {
    setViewerOpen(false);
    setCurrentIndex(-1);
  }, []);

  // index を直接変更（Viewer 用）
  const setIndex = useCallback(
    (nextIndex: number) => {
      if (nextIndex < 0 || nextIndex >= mediaNodes.length) return;
      setCurrentIndex(nextIndex);
    },
    [mediaNodes.length]
  );

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < mediaNodes.length - 1;

  return {
    viewerOpen,
    mediaNodes,
    currentIndex,
    hasPrev,
    hasNext,
    openViewerAt,
    closeViewer,
    setIndex,
  };
};
