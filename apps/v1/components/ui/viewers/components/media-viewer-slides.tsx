"use client";

import { MediaViewerSlideRenderer } from "@/components/ui/viewers/components/media-viewer-slide-renderer";
import {
  ContentSlide,
  getSlideIndex,
  MediaViewerSlide,
} from "@/components/ui/viewers/lib/media-viewer/slides";
import { clamp } from "@/lib/utils/clamp";
import { RefObject, useCallback, useState } from "react";
import "swiper/css";
import "swiper/css/virtual";
import "swiper/css/zoom";
import { Navigation, Virtual, Zoom } from "swiper/modules";
import { Swiper, SwiperClass, SwiperSlide } from "swiper/react";
import { Swiper as SwiperType } from "swiper/types";

interface MediaViewerSlidesProps {
  allSlides: MediaViewerSlide[];
  currentSlideIndex: number;
  initialIndex: number;
  hasPrev: boolean;
  swiperRef: RefObject<SwiperType | null>;
  onSlideChange: (swiper: SwiperClass) => void;
  setCurrentSlideIndex: (index: number) => void;
}

export function MediaViewerSlides({
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
