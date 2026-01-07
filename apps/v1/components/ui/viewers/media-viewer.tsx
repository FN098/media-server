"use client";

import { APP_CONFIG } from "@/app.config";
import { FavoriteButton } from "@/components/ui/buttons/favorite-button";
import { MarqueeText } from "@/components/ui/texts/marquee-text";
import { AudioPlayer } from "@/components/ui/viewers/audio-player";
import { ImageViewer } from "@/components/ui/viewers/image-viewer";
import { VideoPlayer } from "@/components/ui/viewers/video-player";
import { useAutoHidingUI } from "@/hooks/use-auto-hide";
import { useDocumentTitleControl } from "@/hooks/use-document-title";
import { useFullscreen } from "@/hooks/use-fullscreen";
import { useShortcutKeys } from "@/hooks/use-shortcut-keys";
import { isMedia } from "@/lib/media/media-types";
import { MediaNode } from "@/lib/media/types";
import { getParentDirPath } from "@/lib/path/helpers";
import { IndexLike } from "@/lib/query/types";
import { useFavoritesContext } from "@/providers/favorites-provider";
import { useViewerContext } from "@/providers/viewer-provider";
import { useIsMobile } from "@/shadcn-overrides/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shadcn/components/ui/dropdown-menu";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Folder,
  FolderInput,
  FolderOutput,
  Loader2,
  Maximize,
  MoreVertical,
  Pin,
  PinOff,
  TagIcon,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import "swiper/css";
import "swiper/css/virtual";
import "swiper/css/zoom";
import { Navigation, Virtual, Zoom } from "swiper/modules";
import { Swiper, SwiperClass, SwiperSlide } from "swiper/react";

const firstPageDummy = { type: "dummy_first", path: "first-page" } as const;
const prevFolderNav = { type: "nav_prev", path: "prev-loader" } as const;
const nextFolderNav = { type: "nav_next", path: "next-loader" } as const;
const lastPageDummy = { type: "dummy_last", path: "last-page" } as const;

type Slide =
  | MediaNode
  | typeof firstPageDummy
  | typeof prevFolderNav
  | typeof nextFolderNav
  | typeof lastPageDummy;

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
  const { isHeaderPinned, toggleIsHeaderPinned } = useViewerContext();
  const hasPrevFolder = !!onPrevFolder;
  const hasNextFolder = !!onNextFolder;
  const isMobile = useIsMobile();
  const { toggleFullscreen } = useFullscreen();
  const { toggleFavorite, isFavorite } = useFavoritesContext();
  const [currentIndex, setCurrentIndex] = useState<number>(initialIndex);
  const [currentNode, setCurrentNode] = useState<MediaNode | null>(
    allNodes[initialIndex] ?? null
  );
  const [isHovered, setIsHovered] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const {
    isVisible: isHeaderVisible,
    toggle: toggleHeaderVisibility,
    interact: interactHeader,
  } = useAutoHidingUI({
    duration: 2000,
    disabled: isHovered || isMenuOpen || isHeaderPinned,
  });
  const swiperRef = useRef<SwiperClass | null>(null);

  // 仮想スライド構成
  // [最初のページダミー] → [前のフォルダナビ] → [メディア配列] → [次のフォルダナビ] → [最後のページダミー]
  const allSlides = useMemo(() => {
    const slides: Slide[] = [...allNodes];

    // 前側のスライドを追加
    if (hasPrevFolder) {
      slides.unshift(firstPageDummy);
      slides.unshift(prevFolderNav);
    } else {
      slides.unshift(firstPageDummy);
    }

    // 後側のスライドを追加
    if (hasNextFolder) {
      slides.push(lastPageDummy);
      slides.push(nextFolderNav);
    } else {
      slides.push(lastPageDummy);
    }

    return slides;
  }, [allNodes, hasPrevFolder, hasNextFolder]);

  // 実際のメディアインデックスからスライドインデックスへの変換
  const getSlideIndex = (mediaIndex: number): number => {
    let offset = 1; // firstPageDummy
    if (hasPrevFolder) offset += 1; // prevFolderNav
    return mediaIndex + offset;
  };

  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(
    getSlideIndex(initialIndex)
  );

  // タイトル設定
  const { setTitle } = useDocumentTitleControl();
  const updateTitle = (node: MediaNode) => {
    const { title, name } = node;
    setTitle(`${title ?? name} | ${APP_CONFIG.meta.title}`);
  };

  // お気に入りボタンクリック時の処理
  const handleToggleFavorite = async () => {
    try {
      if (!currentNode) return;

      const nextIsFavorite = await toggleFavorite(currentNode.path);
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
    if (onOpenFolder) {
      if (!currentNode) return;
      const parentDir = getParentDirPath(currentNode.path);
      onOpenFolder(parentDir);
    }
  };

  // スワイプ時の移動処理
  const handleSwipe = (swiper: SwiperClass) => {
    setCurrentSlideIndex(swiper.activeIndex);

    const slide = allSlides[swiper.activeIndex];

    // ダミーページの場合は何もしない
    if (slide === firstPageDummy || slide === lastPageDummy) {
      return;
    }

    // フォルダ遷移
    if (!!onPrevFolder && slide === prevFolderNav) {
      onPrevFolder("last");
      return;
    }
    if (!!onNextFolder && slide === nextFolderNav) {
      onNextFolder("first");
      return;
    }

    // メディアノードの場合のみ状態更新
    let offset = 1; // firstPageDummy
    if (hasPrevFolder) offset += 1; // prevFolderNav
    const index = swiper.activeIndex - offset;
    const node = allNodes[index];
    if (node) {
      setCurrentIndex(index);
      setCurrentNode(node);
      updateTitle(node);
      onIndexChange(index);
    }
  };

  // マウスホイールイベントでズームを制御する関数
  const handleWheel = (e: React.WheelEvent) => {
    const swiper = swiperRef.current;
    if (!swiper?.zoom) return;

    const currentScale = swiper.zoom.scale;
    const delta = e.deltaY < 0 ? 0.2 : -0.2;
    const newScale = Math.min(Math.max(currentScale + delta, 1), 3);

    if (newScale === 1) {
      swiper.zoom.out();
    } else {
      swiper.zoom.in(newScale);
    }
  };

  // ショートカット
  useShortcutKeys([
    { key: "Escape", callback: () => onClose() },
    { key: "Enter", callback: () => toggleHeaderVisibility() },
    { key: " ", callback: () => toggleHeaderVisibility() },
    { key: "ArrowLeft", callback: () => swiperRef.current?.slidePrev() },
    { key: "ArrowRight", callback: () => swiperRef.current?.slideNext() },
    { key: "a", callback: () => swiperRef.current?.slidePrev() },
    { key: "s", callback: () => void handleToggleFavorite() },
    { key: "d", callback: () => swiperRef.current?.slideNext() },
    { key: "f", callback: () => toggleFullscreen() },
    { key: "p", callback: () => onPrevFolder?.("first") },
    { key: "n", callback: () => onNextFolder?.("first") },
    { key: "o", callback: () => handleOpenFolder() },
    {
      key: "h",
      callback: () => {
        toggleIsHeaderPinned();
        interactHeader();
      },
    },
  ]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden touch-none bg-black">
      {/* ヘッダーエリア（インタラクション検知用） */}
      <div
        className="absolute top-0 left-0 right-0 h-24 z-40"
        onMouseMove={interactHeader}
        onPointerDown={interactHeader}
      />

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
                  key={currentIndex}
                  text={currentNode?.title ?? currentNode?.name ?? "no title"}
                  autoplay={isMobile}
                  speed={40}
                  delay={1}
                />
              </span>
              <span className="text-white/60 text-sm">
                {currentIndex + 1} / {allNodes.length}
              </span>
            </div>

            <div className="flex items-center gap-4">
              {/* ヘッダー固定ピン */}
              <button
                className="p-2 text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full outline-none"
                onClick={toggleIsHeaderPinned}
              >
                {isHeaderPinned ? <PinOff size={28} /> : <Pin size={28} />}
              </button>

              {/* お気に入りボタン */}
              {!!currentNode && isMedia(currentNode.type) && (
                <FavoriteButton
                  variant="viewer"
                  active={!!currentNode && isFavorite(currentNode.path)}
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
                    <DropdownMenuItem onClick={() => handleOpenFolder()}>
                      <Folder className="mr-2 h-4 w-4" />
                      <span>フォルダを開く</span>
                      {!isMobile && (
                        <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 text-xs text-muted-foreground">
                          <kbd className="rounded border px-1.5 py-0.5">O</kbd>
                        </div>
                      )}
                    </DropdownMenuItem>
                  )}

                  {onPrevFolder && (
                    <DropdownMenuItem onClick={() => onPrevFolder("first")}>
                      <FolderOutput className="mr-2 h-4 w-4" />
                      <span>前のフォルダを開く</span>
                      {!isMobile && (
                        <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 text-xs text-muted-foreground">
                          <kbd className="rounded border px-1.5 py-0.5">P</kbd>
                        </div>
                      )}
                    </DropdownMenuItem>
                  )}

                  {onNextFolder && (
                    <DropdownMenuItem onClick={() => onNextFolder("first")}>
                      <FolderInput className="mr-2 h-4 w-4" />
                      <span>次のフォルダを開く</span>
                      {!isMobile && (
                        <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 text-xs text-muted-foreground">
                          <kbd className="rounded border px-1.5 py-0.5">N</kbd>
                        </div>
                      )}
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
        onSwiper={(swiper) => (swiperRef.current = swiper)}
        modules={[Virtual, Navigation, Zoom]}
        initialSlide={getSlideIndex(initialIndex)}
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
          const active = currentSlideIndex === i;
          const isFirstPage = slide === firstPageDummy;
          const isLastPage = slide === lastPageDummy;
          const isPrevFolder = slide === prevFolderNav;
          const isNextFolder = slide === nextFolderNav;

          return (
            <SwiperSlide
              key={slide.path}
              virtualIndex={i}
              className="flex items-center justify-center"
              onWheel={handleWheel}
            >
              <div className="w-full h-full flex items-center justify-center">
                {isFirstPage ? (
                  // 最初のページダミー
                  <div className="flex flex-col items-center justify-center text-white/70">
                    <ChevronLeft className="mb-4" size={64} strokeWidth={1} />
                    <p className="text-xl font-medium mb-2">最初のページです</p>
                    {hasPrevFolder && (
                      <p className="text-sm text-white/50">
                        前のフォルダに移動するにはもう一度左にスワイプ
                      </p>
                    )}
                  </div>
                ) : isLastPage ? (
                  // 最後のページダミー
                  <div className="flex flex-col items-center justify-center text-white/70">
                    <ChevronRight className="mb-4" size={64} strokeWidth={1} />
                    <p className="text-xl font-medium mb-2">最後のページです</p>
                    {hasNextFolder && (
                      <p className="text-sm text-white/50">
                        次のフォルダに移動するにはもう一度右にスワイプ
                      </p>
                    )}
                  </div>
                ) : isPrevFolder || isNextFolder ? (
                  // 次・前のフォルダ
                  <div className="flex flex-col items-center justify-center text-white/50">
                    <Loader2 className="animate-spin mb-4" size={48} />
                    <p>
                      {isPrevFolder ? "前のフォルダへ..." : "次のフォルダへ..."}
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
