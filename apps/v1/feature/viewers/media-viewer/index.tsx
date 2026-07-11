"use client";

import { useMediaViewerContext } from "@/feature/viewers/media-viewer/providers/media-viewer-provider";
import { MediaViewerHeader } from "@/feature/viewers/media-viewer/ui/header";
import { MediaViewerSlides } from "@/feature/viewers/media-viewer/ui/slides";

export function MediaViewer() {
  const { header } = useMediaViewerContext();

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden touch-none bg-black select-none">
      {/* ヘッダーエリア（インタラクション検知用） */}
      <div
        className="absolute top-0 left-0 right-0 h-24 z-40"
        onMouseMove={header.interact}
        onPointerDown={header.interact}
      />

      <MediaViewerHeader />
      <MediaViewerSlides />
    </div>
  );
}
