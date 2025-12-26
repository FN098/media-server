"use client";

import { AudioPlayer } from "@/components/ui/audio-player";
import { MediaViewerFavoriteButton } from "@/components/ui/favorite-button";
import { ImageViewer } from "@/components/ui/image-viewer";
import { MarqueeText } from "@/components/ui/marquee-text";
import { VideoPlayer } from "@/components/ui/video-player";
import { useFullscreen } from "@/hooks/use-fullscreen";
import { useScrollLock } from "@/hooks/use-scroll-lock";
import { useShortcutKeys } from "@/hooks/use-shortcut-keys";
import { useShowUI } from "@/hooks/use-show-ui";
import { isMedia } from "@/lib/media/detector";
import { MediaNode } from "@/lib/media/types";
import { getClientExplorerPath } from "@/lib/path-helpers";
import { useFavorite } from "@/providers/favorite-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shadcn/components/ui/dropdown-menu";
import { useIsMobile } from "@/shadcn/hooks/use-mobile";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Folder, Maximize, MoreVertical } from "lucide-react";
import Link from "next/link";
import path from "path";
import { memo, useCallback, useState } from "react";
import { toast } from "sonner";
import "swiper/css";
import "swiper/css/virtual";
import { Keyboard, Navigation, Virtual, Zoom } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

interface MediaViewerProps {
  items: MediaNode[];
  initialIndex: number;
  onClose: () => void;
  options?: {
    openFolder: boolean;
  };
}

export function MediaViewer({
  items,
  initialIndex,
  onClose,
  options = {
    openFolder: true,
  },
}: MediaViewerProps) {
  const favoriteCtx = useFavorite();
  const [isHovered, setIsHovered] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { showUI, handleInteraction } = useShowUI({
    delay: 2000,
    disabled: isHovered || isMenuOpen,
  });
  const [index, setIndex] = useState(initialIndex);
  const isMobile = useIsMobile();
  const { toggleFullscreen } = useFullscreen();

  useScrollLock();

  const handleFavorite = useCallback(() => {
    favoriteCtx
      .toggleFavorite(items[index].path)
      .then((nextIsFavorite) => {
        if (nextIsFavorite === undefined) return;

        const message = nextIsFavorite
          ? "⭐お気に入りに登録しました"
          : "お気に入りを解除しました";
        toast.info(message);
      })
      .catch((e) => {
        console.error(e);
        toast.error("お気に入りの更新に失敗しました");
      });
    handleInteraction();
  }, [favoriteCtx, handleInteraction, index, items]);

  // 左右キーは Swiper の keyboard オプションで有効化
  useShortcutKeys([
    { key: "Escape", callback: onClose },
    { key: "f", callback: handleFavorite },
  ]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden touch-none bg-black"
      onMouseMove={handleInteraction}
      onPointerDown={handleInteraction}
    >
      {/* ヘッダー */}
      <AnimatePresence>
        {showUI && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: -10 }}
            exit={{ opacity: 0, y: -20 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="absolute top-0 left-0 right-0 z-60 px-2 py-4 md:p-6 flex items-center justify-between bg-linear-to-b from-black/60 to-transparent"
          >
            {/* 閉じるボタン */}
            <button
              onClick={onClose}
              className="p-2 text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full mr-4"
              aria-label="Close viewer"
            >
              <ArrowLeft size={28} />
            </button>

            {/* ファイル情報 */}
            <div className="flex flex-col gap-1 ml-4 mr-4 flex-1 min-w-0">
              <span className="text-white md:text-lg font-medium drop-shadow-md">
                <MarqueeText
                  key={index}
                  text={items[index].name}
                  autoplay={isMobile}
                  speed={40}
                  delay={1}
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
                  onToggle={handleFavorite}
                />
              )}

              {/* メニューボタン */}
              <DropdownMenu onOpenChange={setIsMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <button
                    className="p-2 text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full outline-none"
                    aria-label="Open menu"
                  >
                    <MoreVertical size={28} />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-48">
                  {options.openFolder && (
                    <DropdownMenuItem asChild>
                      <Link
                        href={getClientExplorerPath(
                          path.dirname(items[index].path)
                        )}
                      >
                        <Folder className="mr-2 h-4 w-4" />
                        <span>フォルダを開く</span>
                      </Link>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem onClick={toggleFullscreen}>
                    <Maximize className="mr-2 h-4 w-4" />
                    <span>全画面表示</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* メディアコンテンツ */}
      <Swiper
        modules={[Virtual, Navigation, Keyboard, Zoom]}
        initialSlide={index}
        onSlideChange={(swiper) => setIndex(swiper.activeIndex)}
        virtual={{
          enabled: true,
          slides: items,
          addSlidesBefore: 3,
          addSlidesAfter: 3,
        }}
        keyboard={{ enabled: true }}
        zoom={true}
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
      return <ImageViewer media={media} isCurrent={isCurrent} />;
    case "video":
      return <VideoPlayer media={media} isCurrent={isCurrent} />;
    case "audio":
      return <AudioPlayer media={media} isCurrent={isCurrent} />;
    default:
      return (
        <div className="text-white/50 text-sm">
          Unsupported file type: {media.type}
        </div>
      );
  }
});
