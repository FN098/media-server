"use client";

import { MediaThumb } from "@/components/ui/thumbnails/media-thumb";
import { useMounted } from "@/hooks/use-mounted";
import { MediaNode } from "@/lib/media/types";
import React, { memo, useState } from "react";
import { createPortal } from "react-dom";

interface Coords {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Size {
  width: number;
  height: number;
}

interface HoverPreviewPortalProps {
  node: MediaNode;
  children: React.ReactNode;
  enabled?: boolean;
  maxWidth?: number;
}

export const HoverPreviewPortal = memo(function HoverPreviewPortal({
  node,
  children,
  enabled = true,
  maxWidth = 300,
}: HoverPreviewPortalProps) {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [imageSize, setImageSize] = useState<Size | null>(null);
  const isMounted = useMounted();

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!enabled) return;

    // 画像サイズが取得できている場合はそれを使用、なければデフォルト
    const aspectRatio = imageSize ? imageSize.width / imageSize.height : 16 / 9;

    // プレビューサイズを計算
    const previewWidth = Math.min(maxWidth, maxWidth * aspectRatio);
    const previewHeight = previewWidth / aspectRatio;

    // マウス位置から少しずらす
    let x = e.clientX + 20;
    let y = e.clientY + 20;

    // 画面端判定
    if (x + previewWidth > window.innerWidth) {
      x = e.clientX - previewWidth - 20;
    }
    if (y + previewHeight > window.innerHeight) {
      y = window.innerHeight - previewHeight - 20;
    }

    setCoords({ x, y, width: previewWidth, height: previewHeight });
  };

  const handleMouseLeave = () => {
    setCoords(null);
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="contents"
    >
      {children}

      {enabled &&
        coords &&
        isMounted &&
        createPortal(
          <div
            className="fixed z-[50] pointer-events-none overflow-hidden rounded-xl border-2 border-primary/20 bg-background shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            style={{
              left: coords.x,
              top: coords.y,
              width: `${coords.width}px`,
              height: `${coords.height}px`,
            }}
          >
            <div className="w-full h-full relative">
              <MediaThumb
                node={node}
                className="w-full h-full object-contain bg-black"
                onLoad={handleImageLoad}
              />
            </div>
          </div>,
          document.body
        )}
    </div>
  );
});
