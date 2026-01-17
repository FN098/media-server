"use client";

import { MediaThumb } from "@/components/ui/thumbnails/media-thumb";
import { useMounted } from "@/hooks/use-mounted";
import { MediaNode } from "@/lib/media/types";
import { AnimatePresence, motion } from "framer-motion";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
  const isMounted = useMounted();
  const [coords, setCoords] = useState<Coords | null>(null);
  const [visible, setVisible] = useState(false);
  const [hasEverHovered, setHasEverHovered] = useState(false); // 一度でもホバーしたか
  const [imageSize, setImageSize] = useState<Size | null>(null);

  const tagAreaHeight = node.tags && node.tags.length > 0 ? 44 : 0;

  const [shouldScroll, setShouldScroll] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null); // ResizeObserver を使って表示された瞬間のサイズを正確に測る

  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const observer = new ResizeObserver(() => {
      const containerWidth = container.offsetWidth;
      // contentの中には 2つのdiv(origとcopy) が入る可能性があるため
      // 最初の1つのユニット分の幅を計測する
      const firstUnit = content.children[0] as HTMLElement;
      if (firstUnit) {
        // ユニット幅 + gap(6px) がコンテナより大きければスクロール
        setShouldScroll(firstUnit.offsetWidth + 6 > containerWidth);
      }
    });

    observer.observe(container);
    // 子要素のサイズ変更も監視（画像読み込み等でレイアウトが変わる場合のため）
    observer.observe(content);

    return () => observer.disconnect();
  }, [visible, node.tags]);

  // アニメーション速度の計算 (1タグあたり約2秒など)
  const duration = useMemo(() => {
    return Math.max(4, (node.tags?.length ?? 0) * 1.5);
  }, [node.tags]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!enabled) return;

      const aspectRatio = imageSize
        ? imageSize.width / imageSize.height
        : 16 / 9;

      const width = Math.min(maxWidth, maxWidth * aspectRatio);
      const height = width / aspectRatio + tagAreaHeight;

      let x = e.clientX + 20;
      let y = e.clientY + 20;

      if (x + width > window.innerWidth) {
        x = e.clientX - width - 20;
      }
      if (y + height > window.innerHeight) {
        y = window.innerHeight - height - 20;
      }

      setCoords({ x, y, width, height });
    },
    [enabled, imageSize, maxWidth, tagAreaHeight]
  );

  const handleMouseEnter = useCallback(() => {
    if (!enabled) return;
    setHasEverHovered(true); // 初回ホバー時にフラグを立てる
    setVisible(true);
  }, [enabled]);

  const handleMouseLeave = useCallback(() => {
    setVisible(false);
  }, []);

  const handleImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
    },
    []
  );

  // ポータルの内容をメモ化 - hasEverHoveredがtrueになるまでnullを返す
  const portalContent = useMemo(() => {
    if (!enabled || !coords || !isMounted || !hasEverHovered) return null;

    return (
      <AnimatePresence>
        {visible && (
          <motion.div
            className="fixed z-[50] pointer-events-none overflow-hidden rounded-xl border-2 border-primary/20 bg-background shadow-2xl"
            initial={{
              opacity: 0,
              scale: 0.85,
              y: 10,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.9,
              y: 5,
            }}
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
              height: `${coords.height}px`,
            }}
          >
            {/* メディア部分 */}
            <div className="relative flex-1 bg-black overflow-hidden">
              <MediaThumb
                node={node}
                className="w-full h-full object-contain"
                onLoad={handleImageLoad}
              />
            </div>

            {/* タグ部分 */}
            {node.tags && node.tags.length > 0 && (
              <div
                ref={containerRef}
                className="relative border-t border-primary/10 bg-background/95 backdrop-blur overflow-hidden"
              >
                {/* 左右のフェードエフェクト */}
                <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-background to-transparent z-10" />
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10" />

                <motion.div
                  ref={contentRef}
                  className="flex gap-1.5 p-2 w-max"
                  animate={shouldScroll ? { x: [0, "-49%"] } : { x: 0 }}
                  transition={{
                    duration: duration,
                    ease: "linear",
                    repeat: Infinity,
                    repeatType: "loop",
                  }}
                >
                  {/* 1ユニット目 */}
                  <div className="flex gap-1.5">
                    {node.tags.map((tag, i) => (
                      <TagItem key={`orig-${i}`} name={tag.name} />
                    ))}
                  </div>

                  {/* 2ユニット目（スクロール時のみ表示） */}
                  {shouldScroll && (
                    <div className="flex gap-1.5">
                      {node.tags.map((tag, i) => (
                        <TagItem key={`copy-${i}`} name={tag.name} />
                      ))}
                    </div>
                  )}
                </motion.div>
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
    shouldScroll,
    duration,
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
});

const TagItem = ({ name }: { name: string }) => (
  <span className="px-2 py-0.5 text-[10px] font-medium bg-secondary text-secondary-foreground rounded-md border border-primary/5 whitespace-nowrap flex-shrink-0">
    {name}
  </span>
);
