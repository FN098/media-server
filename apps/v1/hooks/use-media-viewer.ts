"use client";

import { isMedia } from "@/lib/media/detector";
import { MediaNode } from "@/lib/media/types";
import { useCallback, useMemo, useState } from "react";

export const useMediaViewer = (mediaList: MediaNode[]) => {
  const [viewerOpen, setViewerOpen] = useState(false);

  // メディアのみ抽出
  const mediaNodes = useMemo(
    () => mediaList.filter((node) => isMedia(node.type)),
    [mediaList]
  );

  const openViewer = useCallback(() => {
    setViewerOpen(true);
  }, []);

  const closeViewer = useCallback(() => {
    setViewerOpen(false);
  }, []);

  return {
    viewerOpen,
    mediaNodes,
    openViewer,
    closeViewer,
  };
};
