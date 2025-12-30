"use client";

import { APP_CONFIG } from "@/app.config";
import { AudioPlayer } from "@/components/ui/audio-player";
import { FavoriteButton } from "@/components/ui/favorite-button";
import { ImageViewer } from "@/components/ui/image-viewer";
import { MarqueeText } from "@/components/ui/marquee-text";
import { TagEditorBar } from "@/components/ui/tag-editor-bar";
import { VideoPlayer } from "@/components/ui/video-player";
import { useAutoHidingUI } from "@/hooks/use-auto-hide";
import { useFullscreen } from "@/hooks/use-fullscreen";
import { useScrollLockControl } from "@/hooks/use-scroll-lock";
import { useShortcutKeys } from "@/hooks/use-shortcut-keys";
import { useTitleControl } from "@/hooks/use-title";
import { isMedia } from "@/lib/media/media-types";
import { MediaNode } from "@/lib/media/types";
import { getClientExplorerPath } from "@/lib/path/helpers";
import { useFavorite } from "@/providers/favorite-provider";
import { QueryProvider } from "@/providers/query-provider";
import { SelectionProvider } from "@/providers/selection-provider";
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
  TagIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import path from "path";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import "swiper/css";
import "swiper/css/virtual";
import { Navigation, Virtual, Zoom } from "swiper/modules";
import { Swiper, SwiperClass, SwiperSlide } from "swiper/react";

type MediaViewerFeatures = {
  openFolder?: boolean;
};

interface MediaViewerProps {
  items: MediaNode[];
  initialIndex: number;
  onClose: () => void;
  features?: MediaViewerFeatures;
  onNextFolder?: (at: "first" | "last") => void;
  onPrevFolder?: (at: "first" | "last") => void;
}

type Slide =
  | MediaNode
  | {
      type: "nav_prev";
      path: "prev-loader";
    }
  | {
      type: "nav_next";
      path: "next-loader";
    };

const DEFAULT_FEATURES: Required<MediaViewerFeatures> = {
  openFolder: true,
};

export function MediaViewer({
  items,
  initialIndex,
  onClose,
  features,
  onNextFolder,
  onPrevFolder,
}: MediaViewerProps) {
  const mergedFeatures = {
    ...DEFAULT_FEATURES,
    ...features,
  };
  const favoriteCtx = useFavorite();
  const [index, setIndex] = useState(initialIndex);
  const [isTagEditing, setIsTagEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const {
    isVisible: isHeaderVisible,
    toggle: toggleHeaderVisibility,
    interact: interactHeader,
  } = useAutoHidingUI({
    duration: 2000,
    disabled: isHovered || isMenuOpen,
  });
  const isMobile = useIsMobile();
  const { toggleFullscreen } = useFullscreen();
  const [swiperInstance, setSwiperInstance] = useState<SwiperClass | null>(
    null
  );
  const { setTitle, resetTitle } = useTitleControl();
  const { lock: lockScroll, unlock: unlockScroll } = useScrollLockControl();
  const router = useRouter();

  const { openFolder } = mergedFeatures;

  // スクロールロック
  useEffect(() => {
    lockScroll();

    return () => {
      unlockScroll();
    };
  }, [lockScroll, unlockScroll]);

  // タイトル設定
  useEffect(() => {
    const { title, name } = items[index];
    setTitle(`${title ?? name} | ${APP_CONFIG.meta.title}`);
  }, [index, items, resetTitle, setTitle]);

  // お気に入りボタンクリック時の処理
  const handleToggleFavorite = useCallback(async () => {
    try {
      const nextIsFavorite = await favoriteCtx.toggleFavorite(
        items[index].path
      );
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
  }, [favoriteCtx, interactHeader, index, items]);

  const handleOpenFolder = () => {
    const url = getClientExplorerPath(path.dirname(items[index].path));
    router.push(url);
  };

  useShortcutKeys([
    { key: "Escape", callback: onClose },
    { key: "Enter", callback: toggleHeaderVisibility },
    { key: " ", callback: toggleHeaderVisibility },
    { key: "ArrowLeft", callback: () => swiperInstance?.slidePrev() },
    { key: "ArrowRight", callback: () => swiperInstance?.slideNext() },
    { key: "a", callback: () => swiperInstance?.slidePrev() },
    { key: "s", callback: () => void handleToggleFavorite() },
    { key: "d", callback: () => swiperInstance?.slideNext() },
    { key: "f", callback: toggleFullscreen },
    { key: "t", callback: () => setIsTagEditing((prev) => !prev) },
    { key: "q", callback: () => onPrevFolder?.("first") }, // ショートカットで戻る場合は最初のファイルを開く
    { key: "e", callback: () => onNextFolder?.("first") },
    { key: "o", callback: handleOpenFolder },
  ]);

  const hasPrev = !!onPrevFolder;
  const hasNext = !!onNextFolder;
  const offsetPrev = hasPrev ? 1 : 0;

  // 前のフォルダ、次のフォルダを仮想スライドに追加
  const allSlides = useMemo(() => {
    const slides: Slide[] = [...items];
    if (hasPrev) slides.unshift({ type: "nav_prev", path: "prev-loader" });
    if (hasNext) slides.push({ type: "nav_next", path: "next-loader" });
    return slides;
  }, [items, hasPrev, hasNext]);

  // 仮想スライド中のコンテンツ専用インデックス
  const [vindex, setVIndex] = useState(initialIndex + offsetPrev);

  // スワイプ時の移動処理
  const handleSwipe = (swiper: SwiperClass) => {
    const activeIdx = swiper.activeIndex;
    setVIndex(activeIdx);

    const itemIdx = Math.max(
      0,
      Math.min(activeIdx - offsetPrev, items.length - 1)
    );
    setIndex(itemIdx);

    if (hasPrev && activeIdx === 0) {
      onPrevFolder("last");
    }
    if (hasNext && activeIdx === allSlides.length - 1) {
      onNextFolder("first");
    }
  };

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
                  text={items[index].title ?? items[index].name}
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
                <FavoriteButton
                  variant="viewer"
                  active={favoriteCtx.isFavorite(items[index].path)}
                  onToggle={() => void handleToggleFavorite()}
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
                  {openFolder && (
                    <DropdownMenuItem asChild>
                      <Link
                        href={getClientExplorerPath(
                          path.dirname(items[index].path)
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

                  <DropdownMenuItem
                    onClick={() => setIsTagEditing(!isTagEditing)}
                  >
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
        {allSlides.map((item, i) => (
          <SwiperSlide
            key={item.path}
            virtualIndex={i} // 0から始まる連続した数値
            className="flex items-center justify-center"
          >
            <div className="w-full h-full flex items-center justify-center">
              {item.type === "nav_prev" || item.type === "nav_next" ? (
                <div className="flex flex-col items-center justify-center text-white/50">
                  <Loader2 className="animate-spin mb-4" size={48} />
                  <p>
                    {item.type === "nav_prev"
                      ? "前のフォルダへ..."
                      : "次のフォルダへ..."}
                  </p>
                </div>
              ) : (
                <Media media={item} isCurrent={index === i - offsetPrev} />
              )}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* タグエディター */}
      <SelectionProvider>
        <QueryProvider>
          <TagEditorBar
            allNodes={[items[index]]}
            mode={isTagEditing ? "single" : "none"}
          />
        </QueryProvider>
      </SelectionProvider>
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
