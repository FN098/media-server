import { MediaNode } from "@/lib/media/types";
import {
  buildMediaViewerSlides,
  getMediaIndex,
  getSlideIndex,
} from "@/lib/viewer/slides";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SwiperClass } from "swiper/react";

interface UseMediaViewerNavigationProps {
  allNodes: MediaNode[];
  initialIndex?: number;
  onIndexChange?: (index: number) => void;
  onOpenPrev?: () => void;
  onOpenNext?: () => void;
  onNodeChange?: (node: MediaNode) => void;
}

export function useMediaViewerNavigation({
  allNodes,
  initialIndex = 0,
  onIndexChange,
  onOpenPrev,
  onOpenNext,
  onNodeChange,
}: UseMediaViewerNavigationProps) {
  const hasPrev = !!onOpenPrev;
  const hasNext = !!onOpenNext;

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(
    getSlideIndex(initialIndex, hasPrev)
  );

  const swiperRef = useRef<SwiperClass | null>(null);

  const lastViewedPathRef = useRef<string | null>(
    allNodes[initialIndex]?.path ?? null
  );

  const currentNode = useMemo(
    () => allNodes[currentIndex] ?? null,
    [allNodes, currentIndex]
  );

  const allSlides = useMemo(
    () => buildMediaViewerSlides({ nodes: allNodes, hasPrev, hasNext }),
    [allNodes, hasPrev, hasNext]
  );

  const updateActiveSlide = useCallback(
    (activeSlideIndex: number) => {
      const slide = allSlides[activeSlideIndex];
      if (!slide) return;
      if (slide.type === "empty") return;

      // ナビゲーション（前後のアルバムを開くなど）のトリガー
      if (slide.type === "navigation") {
        if (slide.direction === "prev") onOpenPrev?.();
        if (slide.direction === "next") onOpenNext?.();
        return;
      }

      setCurrentSlideIndex(activeSlideIndex);

      const index = getMediaIndex(activeSlideIndex, hasPrev);
      const node = allNodes[index];
      if (!node) return;

      setCurrentIndex(index);
      onNodeChange?.(node);
      onIndexChange?.(index);

      lastViewedPathRef.current = node.path;
    },
    [
      allSlides,
      hasPrev,
      allNodes,
      onIndexChange,
      onOpenPrev,
      onOpenNext,
      onNodeChange,
    ]
  );

  useEffect(() => {
    const path = lastViewedPathRef.current;
    if (!path) return;

    const index = allNodes.findIndex((n) => n.path === path);
    if (index === -1 || index === currentIndex) return;

    const slideIndex = getSlideIndex(index, hasPrev);
    const node = allNodes[index];
    if (!node) return;

    setCurrentIndex(index);
    setCurrentSlideIndex(slideIndex);

    onNodeChange?.(node);
    onIndexChange?.(index);

    swiperRef.current?.slideTo(slideIndex, 0);
  }, [allNodes, currentIndex, hasPrev, onIndexChange, onNodeChange]);

  return {
    hasPrev,
    hasNext,
    initialIndex,
    currentIndex,
    currentSlideIndex,
    currentNode,
    allNodes,
    allSlides,
    swiperRef,
    updateActiveSlide,
    setCurrentSlideIndex,
  };
}
