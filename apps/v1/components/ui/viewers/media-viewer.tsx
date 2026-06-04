"use client";

import { FavoriteButton } from "@/components/ui/buttons/favorite-button";
import { ViewerHeaderPinButton } from "@/components/ui/buttons/viewer-header-pin-button";
import { NodeDropdownMenu } from "@/components/ui/dropdown-menus/node-dropdown-menu";
import { ClickToCopy } from "@/components/ui/texts/click-to-copy";
import { MarqueeText } from "@/components/ui/texts/marquee-text";
import { AudioPlayer } from "@/components/ui/viewers/audio-player";
import { ImageViewer } from "@/components/ui/viewers/image-viewer";
import { VideoPlayer } from "@/components/ui/viewers/video-player";
import {
  MediaViewerContext,
  useMediaViewer,
} from "@/hooks/viewer/use-media-viewer";
import { isMedia } from "@/lib/media/detectors";
import { MediaNode } from "@/lib/media/types";
import { MenuItemDef, NodeContext } from "@/lib/menu-items/types";
import { assertNever } from "@/lib/utils/assert";
import { clamp } from "@/lib/utils/clamp";
import {
  ContentSlide,
  getSlideIndex,
  MediaViewerSlide,
} from "@/lib/viewer/slides";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useCallback, useEffect } from "react";
import "swiper/css";
import "swiper/css/virtual";
import "swiper/css/zoom";
import { Navigation, Virtual, Zoom } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

interface MediaViewerProps {
  allNodes: MediaNode[];
  initialIndex?: number;
  hotkeysEnabled?: boolean;
  menuItems?: MenuItemDef<NodeContext>[];
  onIndexChange: (index: number) => void;
  onClose: () => void;
  onOpenPrev?: () => void;
  onOpenNext?: () => void;
  onOpenParent?: (node: MediaNode) => void;
  onDelete?: (node: MediaNode) => void;
}

export function MediaViewer(props: MediaViewerProps) {
  const viewer = useMediaViewer(props);

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden touch-none bg-black select-none">
      {/* ヘッダーエリア（インタラクション検知用） */}
      <div
        className="absolute top-0 left-0 right-0 h-24 z-40"
        onMouseMove={viewer.header.interact}
        onPointerDown={viewer.header.interact}
      />

      <MediaViewerHeader viewer={viewer} />
      <MediaViewerSlides viewer={viewer} />
    </div>
  );
}

// ===== ヘッダー =====

interface MediaViewerHeaderProps {
  viewer: MediaViewerContext;
}

function MediaViewerHeader({ viewer }: MediaViewerHeaderProps) {
  const {
    navigation: { allNodes, currentIndex, currentNode },
    header: {
      setIsHovered,
      pinned,
      visibility: { isVisible },
      isMenuOpen,
      setIsMenuOpen,
    },
    headerMenuItems,
    onClose,
    favorite: { rating, isFavorite, toggleFavorite },
  } = viewer;

  return (
    <AnimatePresence>
      {isVisible && (
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
          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full mr-4"
          >
            <ArrowLeft size={28} />
          </button>

          <div className="flex flex-col gap-1 ml-4 mr-4 flex-1 min-w-0 select-text">
            <span className="text-white md:text-lg font-medium drop-shadow-md">
              <MarqueeText key={currentIndex} speed={40} delay={1}>
                <ClickToCopy>
                  {currentNode?.title ?? currentNode?.name ?? "no title"}
                </ClickToCopy>
              </MarqueeText>
            </span>
            <span className="text-white/60 text-sm">
              {allNodes.length > 0
                ? `${currentIndex + 1} / ${allNodes.length}`
                : "-"}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <ViewerHeaderPinButton
              isPinned={pinned.enabled}
              onClick={pinned.toggle}
            />

            {!!currentNode && isMedia(currentNode.type) && (
              <FavoriteButton
                variant="large"
                rating={rating}
                isFavorite={isFavorite}
                onClick={toggleFavorite}
              />
            )}

            {currentNode && (
              <NodeDropdownMenu
                node={currentNode}
                menuItems={headerMenuItems}
                open={isMenuOpen}
                onOpenChange={setIsMenuOpen}
                triggerType="large"
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ===== スライド =====

interface MediaViewerSlidesProps {
  viewer: MediaViewerContext;
}

function MediaViewerSlides({ viewer }: MediaViewerSlidesProps) {
  const {
    navigation: {
      allSlides,
      currentSlideIndex,
      initialIndex,
      hasPrev,
      swiperRef,
      updateActiveSlide,
      setCurrentSlideIndex,
    },
  } = viewer;

  const handleWheel = useCallback(
    (e: React.WheelEvent, slide: ContentSlide, active: boolean) => {
      if (!active || slide.node.type !== "image") return;

      const swiper = swiperRef.current;
      if (!swiper?.zoom) return;

      const deltaY = Math.abs(e.deltaY) < 4 ? 0 : e.deltaY;
      if (deltaY === 0) return;

      e.preventDefault();
      e.stopPropagation();

      const currentScale = swiper.zoom.scale;
      const delta = deltaY < 0 ? 0.2 : -0.2;
      const newScale = clamp(currentScale + delta, 1, 3);

      if (newScale === 1) {
        swiper.zoom.out();
      } else {
        swiper.zoom.in(newScale);
      }
    },
    [swiperRef]
  );

  const goNext = useCallback(() => {
    if (allSlides.length === 0) return;

    const swiper = swiperRef.current;
    if (!swiper) return;

    const start = swiper.activeIndex;

    for (let offset = 1; offset <= allSlides.length; offset++) {
      const index = (start + offset) % allSlides.length;
      const slide = allSlides[index];

      if (slide.type === "content") {
        swiper.slideTo(index);
        return;
      }
    }
  }, [swiperRef, allSlides]);

  return (
    <Swiper
      onSwiper={(swiper) => {
        swiperRef.current = swiper;
        setCurrentSlideIndex(swiper.activeIndex);
      }}
      modules={[Virtual, Navigation, Zoom]}
      initialSlide={getSlideIndex(initialIndex, hasPrev)}
      onSlideChange={(swiper) => updateActiveSlide(swiper.activeIndex)}
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
                ? (e) => handleWheel(e, slide, active)
                : undefined
            }
          >
            <div className="w-full h-full flex items-center justify-center">
              <MediaViewerSlideRenderer
                slide={slide}
                active={active}
                viewer={viewer}
                onNext={goNext}
              />
            </div>
          </SwiperSlide>
        );
      })}
    </Swiper>
  );
}

// ===== スライドレンダラー =====

interface MediaViewerSlideRendererProps {
  slide: MediaViewerSlide;
  active: boolean;
  viewer: MediaViewerContext;
  onNext: () => void;
}

function MediaViewerSlideRenderer({
  slide,
  active,
  viewer,
  onNext,
}: MediaViewerSlideRendererProps) {
  const {
    slideshow: { enabled: isSlideshowEnabled, delay },
    audioRepeating: { enabled: isRepeating, setEnabled: setIsRepeating },
  } = viewer;

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
          return (
            <ImageSlide
              media={slide.node}
              active={active}
              isSlideshowEnabled={isSlideshowEnabled}
              delay={delay}
              onNext={onNext}
            />
          );

        case "video":
          return (
            <VideoPlayer
              media={slide.node}
              active={active}
              onEnded={isSlideshowEnabled ? onNext : undefined}
            />
          );

        case "audio":
          return (
            <AudioPlayer
              media={slide.node}
              active={active}
              isRepeating={isRepeating && !isSlideshowEnabled}
              onRepeatingChange={setIsRepeating}
              disableRepeat={isSlideshowEnabled}
              onEnded={isSlideshowEnabled ? onNext : undefined}
            />
          );

        default:
          return assertNever(slide.node);
      }

    default:
      return assertNever(slide);
  }
}

// ===== 画像スライド =====

interface ImageSlideProps {
  media: MediaNode;
  active: boolean;
  isSlideshowEnabled: boolean;
  onNext: () => void;
  delay?: number;
}

function ImageSlide({
  media,
  active,
  isSlideshowEnabled,
  onNext,
  delay = 5000,
}: ImageSlideProps) {
  useEffect(() => {
    if (!active || !isSlideshowEnabled) return;

    const timer = setTimeout(onNext, delay);
    return () => clearTimeout(timer);
  }, [active, delay, isSlideshowEnabled, onNext]);

  return <ImageViewer media={media} active={active} />;
}
