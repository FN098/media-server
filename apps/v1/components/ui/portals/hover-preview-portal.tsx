"use client";

import { MediaThumb } from "@/components/ui/thumbnails/media-thumb";
import { useMounted } from "@/hooks/use-mounted";
import { MediaNode } from "@/lib/media/types";
import { AnimatePresence, motion } from "framer-motion";
import React, { memo, useCallback, useState } from "react";
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
  const [imageSize, setImageSize] = useState<Size | null>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!enabled) return;

      const aspectRatio = imageSize
        ? imageSize.width / imageSize.height
        : 16 / 9;

      const width = Math.min(maxWidth, maxWidth * aspectRatio);
      const height = width / aspectRatio;

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
    [enabled, imageSize, maxWidth]
  );

  const handleMouseEnter = () => {
    if (!enabled) return;
    setVisible(true);
  };

  const handleMouseLeave = () => {
    setVisible(false);
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
  };

  return (
    <div
      className="contents"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      {enabled &&
        coords &&
        isMounted &&
        createPortal(
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
                <motion.div
                  className="w-full h-full relative"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.05, duration: 0.2 }}
                >
                  <MediaThumb
                    node={node}
                    className="w-full h-full object-contain bg-black"
                    onLoad={handleImageLoad}
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
});
