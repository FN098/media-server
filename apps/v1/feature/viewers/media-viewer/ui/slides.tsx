"use client";

import "swiper/css";
import "swiper/css/virtual";
import "swiper/css/zoom";

import { AudioPlayer } from "@/feature/viewers/audio-player";
import { ImageViewer } from "@/feature/viewers/image-viewer";
import { useMediaViewerContext } from "@/feature/viewers/media-viewer/providers/media-viewer-provider";
import { VideoPlayer } from "@/feature/viewers/video-player";
import { MediaNode } from "@/lib/media/types";
import { assertNever } from "@/lib/utils/assert";
import { clamp } from "@/lib/utils/clamp";
import { ContentSlide, MediaViewerSlide } from "@/lib/viewer/slides";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useCallback, useEffect } from "react";
import { Navigation, Virtual, Zoom } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";

export function MediaViewerSlides() {
  const {
    navigation: {
      allSlides,
      currentSlideIndex,
      slidesKey,
      swiperRef,
      updateActiveSlide,
      setCurrentSlideIndex,
    },
  } = useMediaViewerContext();

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
      key={slidesKey}
      modules={[Virtual, Navigation, Zoom]}
      initialSlide={currentSlideIndex}
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
                onNext={goNext}
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
  onNext: () => void;
}

function MediaViewerSlideRenderer({
  slide,
  active,
  onNext,
}: MediaViewerSlideRendererProps) {
  const {
    slideshow: { enabled: isSlideshowEnabled, delay },
    audioRepeating: { enabled: isRepeating, setEnabled: setIsRepeating },
  } = useMediaViewerContext();

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
