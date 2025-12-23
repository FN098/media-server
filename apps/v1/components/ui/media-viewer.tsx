"use client";

import { AudioPlayer } from "@/components/ui/audio-player";
import { MediaViewerFavoriteButton } from "@/components/ui/favorite-button";
import { ImageViewer } from "@/components/ui/image-viewer";
import { MarqueeText } from "@/components/ui/marquee-text";
import { VideoPlayer } from "@/components/ui/video-player";
import { useShortcutKeys } from "@/hooks/use-shortcut-keys";
import { useShowUI } from "@/hooks/use-show-ui";
import { isMedia } from "@/lib/media/detector";
import { MediaNode } from "@/lib/media/types";
import { useFavorite } from "@/providers/favorite-provider";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { memo, useState } from "react";
import { toast } from "sonner";
import "swiper/css";
import "swiper/css/virtual";
import { Keyboard, Navigation, Virtual } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

interface MediaViewerProps {
  items: MediaNode[];
  initialIndex: number;
  onClose: () => void;
}

export function MediaViewer({
  items,
  initialIndex,
  onClose,
}: MediaViewerProps) {
  const favoriteCtx = useFavorite();
  const { showUI: showHeader, handleInteraction } = useShowUI({ delay: 2000 });
  const [index, setIndex] = useState(initialIndex);

  // 左右キーは Swiper の keyboard オプションで有効化
  useShortcutKeys([{ key: "Escape", callback: onClose }]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden touch-none bg-black"
      onMouseMove={handleInteraction}
      onPointerDown={handleInteraction}
    >
      {/* ヘッダー */}
      <AnimatePresence>
        {showHeader && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: -10 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-0 right-0 z-60 px-2 py-4 md:p-6 flex items-start justify-between bg-linear-to-b from-black/60 to-transparent"
          >
            {/* ファイル情報 */}
            <div className="flex flex-col gap-1 ml-4 mr-4 flex-1 min-w-0">
              <span className="text-white md:text-lg font-medium drop-shadow-md">
                <MarqueeText
                  key={index}
                  text={items[index].name}
                  autoplay
                  speed={120}
                />
              </span>
              <span className="text-white/60 text-sm">
                {index + 1} / {items.length}
              </span>
            </div>

            <div className="flex items-center gap-4">
              {/* お気に入りボタン */}
              {isMedia(items[index].type) && (
                <MediaViewerFavoriteButton
                  active={favoriteCtx.isFavorite(items[index].path)}
                  onToggle={() => {
                    favoriteCtx.toggleFavorite(items[index].path).catch((e) => {
                      console.error(e);
                      toast.error("お気に入りの更新に失敗しました");
                    });
                  }}
                />
              )}

              {/* 閉じるボタン */}
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
      <Swiper
        modules={[Virtual, Navigation, Keyboard]}
        initialSlide={index}
        onSlideChange={(swiper) => setIndex(swiper.activeIndex)}
        virtual={{
          enabled: true,
          slides: items,
          addSlidesBefore: 1,
          addSlidesAfter: 1,
        }}
        keyboard={{ enabled: true }}
        className="h-full w-full"
      >
        {items.map((item, i) => (
          <SwiperSlide
            key={item.path}
            virtualIndex={i}
            className="flex items-center justify-center"
          >
            <div className="w-full h-full flex items-center justify-center">
              <Media media={item} isCurrent={index === i} />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}

const Media = memo(function Media1({
  media,
  isCurrent,
}: {
  media: MediaNode;
  isCurrent: boolean;
}) {
  switch (media.type) {
    case "image":
      return <ImageViewer media={media} />;
    case "video":
      return <VideoPlayer media={media} play={isCurrent} />;
    case "audio":
      return <AudioPlayer media={media} play={isCurrent} />;
    default:
      return (
        <div className="text-white/50 text-sm">
          Unsupported file type: {media.type}
        </div>
      );
  }
});
