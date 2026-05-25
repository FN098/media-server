"use client";

import { APP_CONFIG } from "@/app.config";
import { FavoriteButton } from "@/components/ui/buttons/favorite-button";
import { ViewerHeaderPinButton } from "@/components/ui/buttons/viewer-header-pin-button";
import { ViewerActionsDropdownMenu } from "@/components/ui/dropdown-menus/viewer-actions-dropdown-menu";
import { ClickToCopy } from "@/components/ui/texts/click-to-copy";
import { MarqueeText } from "@/components/ui/texts/marquee-text";
import { AudioPlayer } from "@/components/ui/viewers/audio-player";
import { useMediaViewerFavorite } from "@/components/ui/viewers/hooks/use-media-viewer-favorite";
import { useMediaViewerHotkeys } from "@/components/ui/viewers/hooks/use-media-viewer-hotkeys";
import { useMediaViewerNavigation } from "@/components/ui/viewers/hooks/use-media-viewer-navigation";
import { ImageViewer } from "@/components/ui/viewers/image-viewer";
import {
  ContentSlide,
  getSlideIndex,
  MediaViewerSlide,
} from "@/components/ui/viewers/lib/slides";
import { VideoPlayer } from "@/components/ui/viewers/video-player";
import { useAutoHidingUI } from "@/hooks/use-auto-hide";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { isMedia } from "@/lib/media/media-types";
import { MediaNode } from "@/lib/media/types";
import { MenuItemDef, NodeContext } from "@/lib/menu-items/types";
import { assertNever } from "@/lib/utils/assert";
import { clamp } from "@/lib/utils/clamp";
import { useViewerHeaderPinnedContext } from "@/providers/viewer-header-pinned-provider";
import { useIsMobile } from "@/shadcn-overrides/hooks/use-mobile";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import {
  Dispatch,
  RefObject,
  SetStateAction,
  useCallback,
  useState,
} from "react";
import "swiper/css";
import "swiper/css/virtual";
import "swiper/css/zoom";
import { Navigation, Virtual, Zoom } from "swiper/modules";
import { Swiper, SwiperClass, SwiperSlide } from "swiper/react";
import { Swiper as SwiperType } from "swiper/types";

interface MediaViewerProps {
  allNodes: MediaNode[];
  initialIndex?: number;
  hotkeysEnabled?: boolean;
  menuItems?: MenuItemDef<NodeContext>[];
  onIndexChange?: (index: number) => void;
  onClose?: () => void;
  onOpenPrev?: () => void;
  onOpenNext?: () => void;
  onOpenParent?: (node: MediaNode) => void;
  onDelete?: (node: MediaNode) => void;
}

export function MediaViewer({
  allNodes,
  initialIndex = 0,
  hotkeysEnabled = true,
  menuItems,
  onIndexChange,
  onClose,
  onOpenPrev,
  onOpenNext,
  onOpenParent,
  onDelete,
}: MediaViewerProps) {
  // ===== ヘッダー =====

  const [isHovered, setIsHovered] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { value: isHeaderPinned, toggle: toggleIsHeaderPinned } =
    useViewerHeaderPinnedContext();

  const {
    isVisible: isHeaderVisible,
    toggle: toggleHeaderVisibility,
    interact: interactHeader,
  } = useAutoHidingUI({
    duration: 2000,
    disabled: isHovered || isMenuOpen || isHeaderPinned,
  });

  // ===== タイトル =====

  const { setTitle } = useDocumentTitle();

  // タイトルにファイルタイトルまたはファイル名を設定
  const updateTitle = useCallback(
    (node: MediaNode) => {
      setTitle(`${node.title ?? node.name} | ${APP_CONFIG.meta.title}`);
    },
    [setTitle]
  );

  // ===== ナビゲーション =====

  const {
    hasPrev,
    currentIndex,
    currentSlideIndex,
    currentNode,
    allSlides,
    swiperRef,
    onSlideChange,
    setCurrentSlideIndex,
  } = useMediaViewerNavigation({
    allNodes,
    initialIndex,
    onIndexChange,
    onOpenPrev,
    onOpenNext,
    onNodeChange: updateTitle,
  });

  // ===== お気に入り =====

  const { isFavorite, rating, toggleFavorite, changeRating } =
    useMediaViewerFavorite({
      currentNode,
      interactHeader,
    });

  // ===== ショートカット =====

  useMediaViewerHotkeys({
    enabled: hotkeysEnabled,
    swiperRef,
    currentNode,
    isHeaderPinned,
    toggleHeaderVisibility,
    toggleIsHeaderPinned,
    interactHeader,
    onClose,
    onDelete,
    onOpenParent,
    onToggleFavorite: toggleFavorite,
    onChangeRating: changeRating,
  });

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden touch-none bg-black select-none">
      {/* ヘッダーエリア（インタラクション検知用） */}
      <div
        className="absolute top-0 left-0 right-0 h-24 z-40"
        onMouseMove={interactHeader}
        onPointerDown={interactHeader}
      />

      {/* ヘッダー */}
      <MediaViewerHeader
        visible={isHeaderVisible}
        currentNode={currentNode}
        currentIndex={currentIndex}
        totalCount={allNodes.length}
        isHeaderPinned={isHeaderPinned}
        toggleIsHeaderPinned={toggleIsHeaderPinned}
        isHovered={isHovered}
        setIsHovered={setIsHovered}
        isMenuOpen={isMenuOpen}
        setIsMenuOpen={setIsMenuOpen}
        menuItems={menuItems}
        isFavorite={isFavorite}
        rating={rating}
        onToggleFavorite={toggleFavorite}
        onClose={onClose}
      />

      {/* メディアコンテンツ */}
      <MediaViewerSlides
        allSlides={allSlides}
        currentSlideIndex={currentSlideIndex}
        initialIndex={initialIndex}
        hasPrev={hasPrev}
        swiperRef={swiperRef}
        onSlideChange={onSlideChange}
        setCurrentSlideIndex={setCurrentSlideIndex}
      />
    </div>
  );
}

interface MediaViewerHeaderProps {
  visible: boolean;
  currentNode: MediaNode | null;
  currentIndex: number;
  totalCount: number;

  isHeaderPinned: boolean;
  toggleIsHeaderPinned: () => void;

  isHovered: boolean;
  setIsHovered: Dispatch<SetStateAction<boolean>>;

  isMenuOpen: boolean;
  setIsMenuOpen: Dispatch<SetStateAction<boolean>>;

  menuItems?: MenuItemDef<NodeContext>[];

  isFavorite: boolean;
  rating: number | null;

  onToggleFavorite: () => void;
  onClose?: () => void;
}

function MediaViewerHeader({
  visible,
  currentNode,
  currentIndex,
  totalCount,

  isHeaderPinned,
  toggleIsHeaderPinned,

  setIsHovered,

  isMenuOpen,
  setIsMenuOpen,

  menuItems,

  isFavorite,
  rating,

  onToggleFavorite,
  onClose,
}: MediaViewerHeaderProps) {
  const isMobile = useIsMobile();

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="viewer-header"
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
          {/* 閉じる */}
          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full mr-4"
          >
            <ArrowLeft size={28} />
          </button>

          {/* ファイル情報 */}
          <div className="flex flex-col gap-1 ml-4 mr-4 flex-1 min-w-0 select-text">
            <span className="text-white md:text-lg font-medium drop-shadow-md">
              <MarqueeText
                key={currentIndex}
                autoplay={isMobile}
                speed={40}
                delay={1}
              >
                <ClickToCopy>
                  {currentNode?.title ?? currentNode?.name ?? "no title"}
                </ClickToCopy>
              </MarqueeText>
            </span>

            <span className="text-white/60 text-sm">
              {currentIndex + 1} / {totalCount}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <ViewerHeaderPinButton
              enabled={isHeaderPinned}
              onClick={toggleIsHeaderPinned}
            />

            {!!currentNode && isMedia(currentNode.type) && (
              <FavoriteButton
                variant="viewer"
                rating={rating}
                isFavorite={isFavorite}
                onClick={onToggleFavorite}
              />
            )}

            {currentNode && menuItems && (
              <ViewerActionsDropdownMenu
                node={currentNode}
                menuItems={menuItems}
                open={isMenuOpen}
                onOpenChange={setIsMenuOpen}
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface MediaViewerSlidesProps {
  allSlides: MediaViewerSlide[];
  currentSlideIndex: number;
  initialIndex: number;
  hasPrev: boolean;
  swiperRef: RefObject<SwiperType | null>;
  onSlideChange: (swiper: SwiperClass) => void;
  setCurrentSlideIndex: (index: number) => void;
}

function MediaViewerSlides({
  allSlides,
  currentSlideIndex,
  initialIndex,
  hasPrev,
  swiperRef,
  onSlideChange,
  setCurrentSlideIndex,
}: MediaViewerSlidesProps) {
  const [isRepeating, setIsRepeating] = useState(false);

  const handleWheel = useCallback(
    (e: React.WheelEvent, slide: ContentSlide) => {
      if (slide.node.type !== "image") return;

      const swiper = swiperRef.current;
      if (!swiper?.zoom) return;

      const currentScale = swiper.zoom.scale;
      const delta = e.deltaY < 0 ? 0.2 : -0.2;
      const newScale = clamp(currentScale + delta, 1, 3);

      if (newScale === 1) {
        swiper.zoom.out();
      } else {
        swiper.zoom.in(newScale);
      }
    },
    [swiperRef]
  );

  return (
    <Swiper
      onSwiper={(swiper) => {
        swiperRef.current = swiper;
        setCurrentSlideIndex(swiper.activeIndex);
      }}
      modules={[Virtual, Navigation, Zoom]}
      initialSlide={getSlideIndex(initialIndex, hasPrev)}
      onSlideChange={onSlideChange}
      virtual
      zoom
      className="h-full w-full"
      noSwipingSelector="button, input, [data-no-swipe]"
    >
      {allSlides.map((slide, i) => {
        const active = currentSlideIndex === i;

        return (
          <SwiperSlide
            key={slide.key}
            virtualIndex={i}
            onWheel={
              slide.type === "content"
                ? (e) => handleWheel(e, slide)
                : undefined
            }
          >
            <div className="w-full h-full flex items-center justify-center">
              <MediaViewerSlideRenderer
                slide={slide}
                active={active}
                isRepeating={isRepeating}
                onRepeatingChange={setIsRepeating}
              />
            </div>
          </SwiperSlide>
        );
      })}
    </Swiper>
  );
}

interface MediaViewerSlideRendererProps {
  slide: MediaViewerSlide;
  active: boolean;
  isRepeating: boolean;
  onRepeatingChange: (value: boolean) => void;
}

function MediaViewerSlideRenderer({
  slide,
  active,
  isRepeating,
  onRepeatingChange,
}: MediaViewerSlideRendererProps) {
  switch (slide.type) {
    case "empty":
      return slide.position === "first" ? (
        <div className="flex flex-col items-center justify-center text-white/70">
          <ChevronLeft className="mb-4" size={64} strokeWidth={1} />
          <p className="text-xl font-medium mb-2">最初のページです</p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-white/70">
          <ChevronRight className="mb-4" size={64} strokeWidth={1} />
          <p className="text-xl font-medium mb-2">最後のページです</p>
        </div>
      );

    case "navigation":
      return (
        <div className="flex flex-col items-center justify-center text-white/50">
          <Loader2 className="animate-spin mb-4" size={48} />
          <p>
            {slide.direction === "prev"
              ? "前のフォルダへ..."
              : "次のフォルダへ..."}
          </p>
        </div>
      );

    case "content":
      switch (slide.node.type) {
        case "image":
          return <ImageViewer media={slide.node} active={active} />;

        case "video":
          return <VideoPlayer media={slide.node} active={active} />;

        case "audio":
          return (
            <AudioPlayer
              media={slide.node}
              active={active}
              isRepeating={isRepeating}
              onRepeatingChange={onRepeatingChange}
            />
          );

        default:
          return assertNever(slide.node);
      }

    default:
      return assertNever(slide);
  }
}
