"use client";

import { APP_CONFIG } from "@/app.config";
import { AudioPlayer } from "@/components/ui/audio-player";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { ImageViewer } from "@/components/ui/image-viewer";
import { MarqueeText } from "@/components/ui/marquee-text";
import { VideoPlayer } from "@/components/ui/video-player";
import { useAutoHidingUI } from "@/hooks/use-auto-hide";
import { useDocumentTitleControl } from "@/hooks/use-document-title";
import { useFullscreen } from "@/hooks/use-fullscreen";
import { useShortcutKeys } from "@/hooks/use-shortcut-keys";
import { isMedia } from "@/lib/media/media-types";
import { MediaNode } from "@/lib/media/types";
import { getClientExplorerPath } from "@/lib/path/helpers";
import { IndexLike } from "@/lib/query/types";
import { useFavoritesContext } from "@/providers/favorites-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shadcn/components/ui/dropdown-menu";
import { useIsMobile } from "@/shadcn/hooks/use-mobile";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Folder,
  Loader2,
  Maximize,
  MoreVertical,
  Pin,
  PinOff,
  TagIcon,
} from "lucide-react";
import Link from "next/link";
import path from "path";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import "swiper/css";
import "swiper/css/virtual";
import { Navigation, Virtual, Zoom } from "swiper/modules";
import { Swiper, SwiperClass, SwiperSlide } from "swiper/react";

const prevFolderNav = { type: "nav_prev", path: "prev-loader" } as const;
const nextFolderNav = { type: "nav_next", path: "next-loader" } as const;

type Slide = MediaNode | typeof prevFolderNav | typeof nextFolderNav;

export function MediaViewer({
  allNodes,
  initialIndex,
  onIndexChange,
  onClose,
  onOpenFolder,
  onNextFolder,
  onPrevFolder,
  onTags,
}: {
  allNodes: MediaNode[];
  initialIndex: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  onOpenFolder?: (path: string, at?: IndexLike) => void;
  onNextFolder?: (at?: IndexLike) => void;
  onPrevFolder?: (at?: IndexLike) => void;
  onTags?: () => void;
}) {
  const isMobile = useIsMobile();
  const { toggleFavorite, isFavorite } = useFavoritesContext();
  const [index, setIndex] = useState(initialIndex);
  const [isHovered, setIsHovered] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHeaderPinned, setIsHeaderPinned] = useState(false);
  const {
    isVisible: isHeaderVisible,
    toggle: toggleHeaderVisibility,
    interact: interactHeader,
  } = useAutoHidingUI({
    duration: 2000,
    disabled: isHovered || isMenuOpen || isHeaderPinned,
  });
  const { toggleFullscreen } = useFullscreen();
  const [swiperInstance, setSwiperInstance] = useState<SwiperClass | null>(
    null
  );
  const toggleHeaderPinned = () => setIsHeaderPinned((prev) => !prev);

  const hasPrev = !!onPrevFolder;
  const hasNext = !!onNextFolder;
  const offsetPrev = hasPrev ? 1 : 0;

  // 仮想スライド
  const allSlides = useMemo(() => {
    const slides: Slide[] = [...allNodes];
    if (hasPrev) slides.unshift(prevFolderNav); // 先頭: 前のフォルダ
    if (hasNext) slides.push(nextFolderNav); // 末尾: 次のフォルダ
    return slides;
  }, [allNodes, hasPrev, hasNext]);

  // 仮想スライドインデックス
  const [vindex, setVIndex] = useState(initialIndex + offsetPrev);

  // タイトル設定
  const { setTitle } = useDocumentTitleControl();
  useEffect(() => {
    const { title, name } = allNodes[index];
    setTitle(`${title ?? name} | ${APP_CONFIG.meta.title}`);
  }, [index, allNodes, setTitle]);

  // お気に入りボタンクリック時の処理
  const handleToggleFavorite = async () => {
    try {
      const nextIsFavorite = await toggleFavorite(allNodes[index].path);
      if (nextIsFavorite === undefined) return;

      const message = nextIsFavorite
        ? "⭐お気に入りに登録しました"
        : "お気に入りを解除しました";
      toast.info(message);

      interactHeader();
    } catch (e) {
      console.error(e);
      toast.error("お気に入りの更新に失敗しました");
    }
  };

  // 現在のファイルが存在するフォルダを開く
  const handleOpenFolder = () => {
    onOpenFolder?.(path.dirname(allNodes[index].path));
  };

  // インデックス変更確定
  const commitIndex = (itemIdx: number, vIdx: number) => {
    setIndex(itemIdx);
    setVIndex(vIdx);
    onIndexChange(itemIdx); // 親に通知
  };

  // スワイプ時の移動処理
  const handleSwipe = (swiper: SwiperClass) => {
    const vIdx = swiper.activeIndex;
    const itemIdx = Math.max(
      0,
      Math.min(vIdx - offsetPrev, allNodes.length - 1)
    );

    commitIndex(itemIdx, vIdx);

    if (hasPrev && vIdx === 0) {
      onPrevFolder("last");
    }
    if (hasNext && vIdx === allSlides.length - 1) {
      onNextFolder("first");
    }
  };

  // ショートカット
  useShortcutKeys([
    { key: "Escape", callback: () => onClose() },
    { key: "Enter", callback: () => toggleHeaderVisibility() },
    { key: " ", callback: () => toggleHeaderVisibility() },
    { key: "ArrowLeft", callback: () => swiperInstance?.slidePrev() },
    { key: "ArrowRight", callback: () => swiperInstance?.slideNext() },
    { key: "a", callback: () => swiperInstance?.slidePrev() },
    { key: "s", callback: () => void handleToggleFavorite() },
    { key: "d", callback: () => swiperInstance?.slideNext() },
    { key: "f", callback: () => toggleFullscreen() },
    { key: "p", callback: () => onPrevFolder?.() },
    { key: "n", callback: () => onNextFolder?.() },
    { key: "o", callback: () => handleOpenFolder() },
    {
      key: "h",
      callback: () => {
        toggleHeaderPinned();
        interactHeader();
      },
    },
  ]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden touch-none bg-black"
      onMouseMove={interactHeader}
      onPointerDown={interactHeader}
    >
      {/* ヘッダー */}
      <AnimatePresence>
        {isHeaderVisible && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: -10 }}
            exit={{ opacity: 0, y: -20 }}
            onPointerEnter={(e) => {
              if (e.pointerType === "mouse") setIsHovered(true);
            }}
            onPointerLeave={(e) => {
              if (e.pointerType === "mouse") setIsHovered(false);
            }}
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
                  text={allNodes[index].title ?? allNodes[index].name}
                  autoplay={isMobile}
                  speed={40}
                  delay={1}
                />
              </span>
              <span className="text-white/60 text-sm">
                {index + 1} / {allNodes.length}
              </span>
            </div>

            <div className="flex items-center gap-4">
              {/* ヘッダー固定ピン */}
              <button
                className="p-2 text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full outline-none"
                onClick={toggleHeaderPinned}
              >
                {isHeaderPinned ? <PinOff size={28} /> : <Pin size={28} />}
              </button>

              {/* お気に入りボタン */}
              {isMedia(allNodes[index].type) && (
                <FavoriteButton
                  variant="viewer"
                  active={isFavorite(allNodes[index].path)}
                  onClick={() => void handleToggleFavorite()}
                />
              )}

              {/* メニュー */}
              <DropdownMenu onOpenChange={setIsMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <button
                    className="p-2 text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full outline-none"
                    aria-label="Open menu"
                  >
                    <MoreVertical size={28} />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="flex flex-col w-48 gap-2"
                >
                  {onOpenFolder && (
                    <DropdownMenuItem asChild>
                      <Link
                        href={getClientExplorerPath(
                          path.dirname(allNodes[index].path)
                        )}
                      >
                        <Folder className="mr-2 h-4 w-4" />
                        <span>フォルダを開く</span>
                        {!isMobile && (
                          <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 text-xs text-muted-foreground">
                            <kbd className="rounded border px-1.5 py-0.5">
                              O
                            </kbd>
                          </div>
                        )}
                      </Link>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem onClick={toggleFullscreen}>
                    <Maximize className="mr-2 h-4 w-4" />
                    <span>全画面表示</span>
                    {!isMobile && (
                      <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 text-xs text-muted-foreground">
                        <kbd className="rounded border px-1.5 py-0.5">F</kbd>
                      </div>
                    )}
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={onTags}>
                    <TagIcon className="mr-2 h-4 w-4" />
                    <span>タグを表示</span>
                    {!isMobile && (
                      <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 text-xs text-muted-foreground">
                        <kbd className="rounded border px-1.5 py-0.5">T</kbd>
                      </div>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* メディアコンテンツ */}
      <Swiper
        onSwiper={setSwiperInstance}
        modules={[Virtual, Navigation, Zoom]}
        initialSlide={vindex}
        onSlideChange={handleSwipe}
        virtual={{
          enabled: true,
          slides: allSlides,
          addSlidesBefore: 3,
          addSlidesAfter: 3,
        }}
        keyboard={{ enabled: true }}
        zoom={true}
        className="h-full w-full"
      >
        {allSlides.map((slide, i) => {
          const active = index === i - offsetPrev;
          return (
            <SwiperSlide
              key={slide.path}
              virtualIndex={i}
              className="flex items-center justify-center"
            >
              <div className="w-full h-full flex items-center justify-center">
                {slide === prevFolderNav || slide === nextFolderNav ? (
                  // 次・前のフォルダ
                  <div className="flex flex-col items-center justify-center text-white/50">
                    <Loader2 className="animate-spin mb-4" size={48} />
                    <p>
                      {slide === prevFolderNav
                        ? "前のフォルダへ..."
                        : "次のフォルダへ..."}
                    </p>
                  </div>
                ) : slide.type === "image" ? (
                  // 画像
                  <ImageViewer media={slide} active={active} />
                ) : slide.type === "video" ? (
                  // 動画
                  <VideoPlayer media={slide} active={active} />
                ) : slide.type === "audio" ? (
                  // オーディオ
                  <AudioPlayer media={slide} active={active} />
                ) : (
                  <div className="text-white/50 text-sm">
                    Unsupported file type: {slide.type}
                  </div>
                )}
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
}
