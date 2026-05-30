"use client";

import { MediaThumb } from "@/components/ui/thumbnails/media-thumb";
import { useMounted } from "@/hooks/general/use-mounted";
import { MediaNode } from "@/lib/media/types";
import { AnimatePresence, motion } from "framer-motion";
import React, { useCallback, useMemo, useState } from "react";
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

export function HoverPreviewPortal({
  node,
  children,
  enabled = true,
  maxWidth = 300,
}: HoverPreviewPortalProps) {
  const isMounted = useMounted();
  const [coords, setCoords] = useState<Coords | null>(null);
  const [visible, setVisible] = useState(false);
  const [hasEverHovered, setHasEverHovered] = useState(false);
  const [imageSize, setImageSize] = useState<Size | null>(null);

  // マウスカーソルに追従するように座標を再計算
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!enabled) return;

    const aspectRatio = imageSize ? imageSize.width / imageSize.height : 16 / 9;

    const width = Math.min(maxWidth, maxWidth * aspectRatio);

    let x = e.clientX + 20;
    let y = e.clientY + 20;

    // 画面外へのはみ出し判定（高さは中身に応じて変わるため、多めに見積もるか固定にします）
    if (x + width > window.innerWidth) {
      x = e.clientX - width - 20;
    }
    // y軸の調整（タグが多い場合に備えて）
    if (y + 400 > window.innerHeight) {
      y = Math.max(20, window.innerHeight - 400);
    }

    setCoords({ x, y, width, height: 0 }); // heightはCSSの auto で処理
  };

  // カーソルがホバーしたら表示
  const handleMouseEnter = () => {
    if (!enabled) return;
    setHasEverHovered(true);
    setVisible(true);
  };

  // カーソルが外れたら非表示
  const handleMouseLeave = () => {
    setVisible(false);
  };

  // 画像ロード時に画像サイズを取得
  const handleImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
    },
    []
  );

  const portalContent = useMemo(() => {
    if (!enabled || !coords || !isMounted || !hasEverHovered) return null;

    return (
      <AnimatePresence>
        {visible && (
          <motion.div
            key="portal-main"
            className="fixed z-[50] pointer-events-none overflow-hidden rounded-xl border-2 border-primary/20 bg-background shadow-2xl flex flex-col"
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 5 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30,
              mass: 0.8,
            }}
            style={{
              left: coords.x,
              top: coords.y,
              width: `${coords.width}px`,
              maxHeight: "80vh", // 画面を突き抜けないように制限
            }}
          >
            {/* メディア部分 */}
            <div
              className="relative flex-shrink-0 bg-black overflow-hidden flex items-center justify-center"
              style={{
                height: imageSize
                  ? coords.width / (imageSize.width / imageSize.height)
                  : "auto",
              }}
            >
              <MediaThumb
                node={node}
                className="w-full h-full object-contain"
                onLoad={handleImageLoad}
              />
            </div>

            {/* タグ部分（一括表示） */}
            {node.tags && node.tags.length > 0 && (
              <div className="p-2 border-t border-primary/10 bg-background/95 backdrop-blur">
                <div className="flex flex-wrap gap-1.5">
                  {node.tags.map((tag, i) => (
                    <TagItem key={i} name={tag.name} />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    );
  }, [
    enabled,
    coords,
    isMounted,
    hasEverHovered,
    visible,
    node,
    handleImageLoad,
    imageSize,
  ]);

  return (
    <div
      className="contents"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {portalContent && createPortal(portalContent, document.body)}
    </div>
  );
}

const TagItem = ({ name }: { name: string }) => (
  <span className="px-2 py-0.5 text-[10px] font-medium bg-secondary text-secondary-foreground rounded-md border border-primary/5 whitespace-nowrap">
    {name}
  </span>
);
