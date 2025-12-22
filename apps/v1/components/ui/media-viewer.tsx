"use client";

import { AudioPlayer } from "@/components/ui/audio-player";
import { MediaViewerFavoriteButton } from "@/components/ui/favorite-button";
import { ImageViewer } from "@/components/ui/image-viewer";
import { VideoPlayer } from "@/components/ui/video-player";
import { useShortcutKeys } from "@/hooks/use-shortcut-keys";
import { useShowUI } from "@/hooks/use-show-ui";
import { isMedia } from "@/lib/media/detector";
import { MediaNode } from "@/lib/media/types";
import { getThumbUrl } from "@/lib/path-helpers";
import { useFavorite } from "@/providers/favorite-provider";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";

interface MediaViewerProps {
  items: MediaNode[];
  index: number;
  onClose: () => void;
  onChangeIndex: (nextIndex: number) => void;
}

const SWIPE_DISTANCE = 120;
const SWIPE_VELOCITY = 300;

export function MediaViewer({
  items,
  index,
  onClose,
  onChangeIndex,
}: MediaViewerProps) {
  const favoriteCtx = useFavorite();
  const [current, setCurrent] = useState(index);
  const [direction, setDirection] = useState(0);
  const { showUI: showHeader, handleInteraction } = useShowUI(2000);

  if (index !== current) {
    setCurrent(index);
    setDirection(index > current ? 1 : -1);
  }

  const paginate = (newDirection: number) => {
    const nextIndex = index + newDirection;
    if (nextIndex >= 0 && nextIndex < items.length) {
      onChangeIndex(nextIndex);
    }
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0.5,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? "100%" : "-100%",
      opacity: 0.5,
    }),
  };

  useShortcutKeys([
    { key: "ArrowRight", callback: () => paginate(1) },
    { key: "ArrowLeft", callback: () => paginate(-1) },
    { key: "Escape", callback: onClose },
  ]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden touch-none bg-black"
      onMouseMove={handleInteraction}
      onPointerDown={handleInteraction}
    >
      {/* 背景 */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={`bg-${items[current].path}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 z-0 pointer-events-none"
        >
          {/* メディアのサムネイルを背景に全画面表示 */}
          {["image", "video"].includes(items[current].type) && (
            <Image
              src={getThumbUrl(items[current].path)}
              alt=""
              fill
              className="object-cover scale-110 blur-[100px] saturate-[1.8] opacity-60"
              unoptimized
            />
          )}
          {/* 黒のグラデーションで暗さを調整 */}
          <div className="absolute inset-0 bg-black/40 shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]" />
        </motion.div>
      </AnimatePresence>

      {/* ヘッダー */}
      <AnimatePresence>
        {showHeader && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: -10 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-0 right-0 z-60 px-2 py-4 md:p-6 flex items-start justify-between bg-linear-to-b from-black/60 to-transparent"
          >
            <div className="flex flex-col gap-1 ml-4 mr-1">
              <span className="text-white md:text-lg font-medium drop-shadow-md">
                {items[current].name}
              </span>
              <span className="text-white/60 text-sm">
                {current + 1} / {items.length}
              </span>
            </div>

            <div className="flex items-center gap-4">
              {isMedia(items[current].type) && (
                <MediaViewerFavoriteButton
                  active={favoriteCtx.isFavorite(items[current].path)}
                  onToggle={() => {
                    favoriteCtx
                      .toggleFavorite(items[current].path)
                      .catch((e) => {
                        console.error(e);
                        toast.error("お気に入りの更新に失敗しました");
                      });
                  }}
                />
              )}

              <button
                onClick={onClose}
                className="p-2 text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full mr-4"
                aria-label="Close viewer"
              >
                <X size={28} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* メディアコンテンツ */}
      <AnimatePresence initial={false} custom={direction}>
        <motion.div
          key={index}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: {
              type: "spring",
              bounce: 0,
              duration: 0.4,
            },
            opacity: { duration: 0.1 },
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={1}
          onDragEnd={(_, info) => {
            // スワイプで次・前のファイルを開く
            const offset = info.offset.x;
            const velocity = info.velocity.x;

            if (offset < -SWIPE_DISTANCE || velocity < -SWIPE_VELOCITY) {
              paginate(1);
            } else if (offset > SWIPE_DISTANCE || velocity > SWIPE_VELOCITY) {
              paginate(-1);
            }
          }}
          className="absolute w-full h-full flex items-center justify-center"
        >
          <div className="relative w-full h-full flex items-center justify-center">
            <Media media={items[current]} isCurrent />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Media({
  media,
  isCurrent,
}: {
  media: MediaNode;
  isCurrent?: boolean;
}) {
  switch (media.type) {
    case "image":
      return <ImageViewer media={media} />;
    case "video":
      return <VideoPlayer media={media} isCurrent={isCurrent} />;
    case "audio":
      return isCurrent ? <AudioPlayer media={media} /> : null;
    default:
      return (
        <div className="text-white/50 text-sm">
          Unsupported file type: {media.type}
        </div>
      );
  }
}
