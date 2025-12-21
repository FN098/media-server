"use client";

import { LoadingSpinner } from "@/components/ui/spinners";
import { useShortcutKeys } from "@/hooks/use-shortcut-keys";
import { useShowUI } from "@/hooks/use-show-ui";
import { MediaFsNode } from "@/lib/media/types";
import {
  getAbsoluteMediaUrl,
  getMediaUrl,
  getThumbUrl,
} from "@/lib/path-helpers";
import MuxPlayer from "@mux/mux-player-react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface MediaViewerProps {
  items: MediaFsNode[];
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
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center overflow-hidden touch-none"
      onMouseMove={handleInteraction}
      onPointerDown={handleInteraction}
    >
      {/* header */}
      <AnimatePresence>
        {showHeader && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-0 right-0 z-60 px-2 py-4 md:p-6 flex items-start justify-between bg-linear-to-b from-black/60 to-transparent"
          >
            <div className="flex flex-col gap-1 ml-4">
              <span className="text-white md:text-lg font-medium drop-shadow-md">
                {items[current].name}
              </span>
              <span className="text-white/60 text-sm">
                {current + 1} / {items.length}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full mr-4"
              aria-label="Close viewer"
            >
              <X size={28} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* body */}
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
  media: MediaFsNode;
  isCurrent?: boolean;
}) {
  const [isLoaded, setIsLoaded] = useState(false);

  if (media.type === "image") {
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        {/* 背景にサムネイル（軽い画像）を表示しておく */}
        {!isLoaded && (
          <Image
            src={getThumbUrl(media.path)}
            alt={media.name}
            fill
            className="absolute inset-0 w-full h-full object-contain blur-lg opacity-50"
          />
        )}

        <Image
          src={getMediaUrl(media.path)}
          alt={media.name}
          fill
          className={`object-contain transition-opacity duration-500 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
          onLoadingComplete={() => setIsLoaded(true)}
          draggable={false}
          priority
          unoptimized={true}
        />

        {/* さらに重い場合はスピナーも重ねる */}
        {!isLoaded && <LoadingSpinner />}
      </div>
    );
  }

  if (media.type === "video") {
    if (isCurrent) {
      return (
        <div className="relative w-full h-full flex items-center justify-center">
          {!isLoaded && <LoadingSpinner />}

          <div
            className="relative max-w-full max-h-full"
            onPointerDownCapture={(e) => e.stopPropagation()}
          >
            <MuxPlayer
              src={getAbsoluteMediaUrl(media.path)}
              autoPlay
              streamType="on-demand"
              style={{ objectFit: "contain", width: "100%", height: "100%" }}
              className="max-w-full max-h-full"
              onLoadedData={() => setIsLoaded(true)}
            />
          </div>
        </div>
      );
    } else {
      return (
        <div className="relative">
          {!isLoaded && <LoadingSpinner />}

          <Image
            src={getThumbUrl(media.path)}
            alt={media.name}
            fill
            className="max-w-[100vw] max-h-screen object-contain select-none"
            draggable={false}
            onLoadingComplete={() => setIsLoaded(true)}
          />
        </div>
      );
    }
  }

  if (media.type === "audio") {
    if (isCurrent) {
      return <audio src={getMediaUrl(media.path)} controls autoPlay />;
    }
  }

  return null;
}
