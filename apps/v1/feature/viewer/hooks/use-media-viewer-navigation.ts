import { MediaNode } from "@/lib/media/types";
import { hashObject } from "@/lib/utils/fnv1a-hash";
import {
  buildMediaViewerSlides,
  getMediaIndex,
  getSlideIndex,
} from "@/lib/viewer/slides";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SwiperClass } from "swiper/react";

function getSafeMediaIndex(index: number, total: number) {
  if (total === 0) return 0;
  return Math.min(Math.max(index, 0), total - 1);
}

function getFirstEmptySlideIndex(hasPrev: boolean) {
  return hasPrev ? 1 : 0;
}

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
  const initialMediaIndex = getSafeMediaIndex(initialIndex, allNodes.length);

  const [currentMediaIndex, setCurrentMediaIndex] = useState(initialMediaIndex);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(
    getSlideIndex(initialMediaIndex, hasPrev)
  );
  const [lastViewedPath, setLastViewedPath] = useState<string | null>(
    allNodes[initialMediaIndex]?.path ?? null
  );

  const swiperRef = useRef<SwiperClass | null>(null);

  const nodesKey = useMemo(
    () => hashObject(allNodes.map((node) => node.path)),
    [allNodes]
  );

  const restoredMediaIndex = useMemo(() => {
    if (allNodes.length === 0) return 0;

    // 1. パスからインデックスを探す
    const lastViewedMediaIndex = lastViewedPath
      ? allNodes.findIndex((node) => node.path === lastViewedPath)
      : -1;

    // パスが見つかった場合はそれを返す
    if (lastViewedMediaIndex !== -1) {
      return lastViewedMediaIndex;
    }

    // 2. 見つからない場合＝表示中だったファイルが削除されたケース
    // currentMediaIndex は前回のレンダー時のステートが残っているため、
    // レンダー中であっても「直前のインデックス」として安全に参照できます。
    const targetIndex = currentMediaIndex;

    // 「現在の位置（旧 index+1）」が新しい配列の範囲内ならそれをそのまま使う
    // ※ 1つ削除されているため、旧 index+1 が自動的に現在の targetIndex の位置にスライドしてきます
    if (targetIndex < allNodes.length) {
      return targetIndex;
    }

    // 「旧 index+1」が配列外（＝末尾のファイルを消したケース）なら「前のファイル（index-1）」へ
    // ※ 新しい配列の末尾（allNodes.length - 1）になります
    return allNodes.length - 1;
  }, [allNodes, currentMediaIndex, lastViewedPath]);

  const needsNodeSync =
    allNodes.length === 0
      ? currentMediaIndex !== 0
      : allNodes[currentMediaIndex]?.path !== lastViewedPath;
  const activeMediaIndex = needsNodeSync
    ? restoredMediaIndex
    : currentMediaIndex;
  const activeSlideIndex =
    allNodes.length === 0
      ? getFirstEmptySlideIndex(hasPrev)
      : needsNodeSync
        ? getSlideIndex(restoredMediaIndex, hasPrev)
        : currentSlideIndex;

  const activeNode = useMemo(
    () => allNodes[activeMediaIndex] ?? null,
    [activeMediaIndex, allNodes]
  );

  const allSlides = useMemo(
    () => buildMediaViewerSlides({ nodes: allNodes, hasPrev, hasNext }),
    [allNodes, hasPrev, hasNext]
  );

  const updateActiveSlide = useCallback(
    (activeSlideIndex: number) => {
      const slide = allSlides[activeSlideIndex];
      if (!slide) return;

      setCurrentSlideIndex(activeSlideIndex);

      if (slide.type === "empty") return;

      // ナビゲーション（前後のアルバムを開くなど）のトリガー
      if (slide.type === "navigation") {
        if (needsNodeSync) return;

        if (slide.direction === "prev") onOpenPrev?.();
        if (slide.direction === "next") onOpenNext?.();
        return;
      }

      const index = getMediaIndex(activeSlideIndex, hasPrev);
      const node = allNodes[index];
      if (!node) return;

      setCurrentMediaIndex(index);
      setLastViewedPath(node.path);
      onNodeChange?.(node);
      onIndexChange?.(index);
    },
    [
      allSlides,
      hasPrev,
      allNodes,
      needsNodeSync,
      onIndexChange,
      onOpenPrev,
      onOpenNext,
      onNodeChange,
    ]
  );

  useEffect(() => {
    if (!needsNodeSync) return;

    if (allNodes.length === 0) {
      const firstEmptySlideIndex = getFirstEmptySlideIndex(hasPrev);
      const frame = requestAnimationFrame(() => {
        setCurrentMediaIndex(0);
        setCurrentSlideIndex(firstEmptySlideIndex);
        setLastViewedPath(null);
      });

      return () => cancelAnimationFrame(frame);
    }

    const node = allNodes[restoredMediaIndex];
    if (!node) return;

    onNodeChange?.(node);
    onIndexChange?.(restoredMediaIndex);

    const slideIndex = getSlideIndex(restoredMediaIndex, hasPrev);
    const frame = requestAnimationFrame(() => {
      setCurrentMediaIndex(restoredMediaIndex);
      setCurrentSlideIndex(slideIndex);
      setLastViewedPath(node.path);
    });

    return () => cancelAnimationFrame(frame);
  }, [
    allNodes,
    hasPrev,
    needsNodeSync,
    onIndexChange,
    onNodeChange,
    restoredMediaIndex,
  ]);

  return {
    hasPrev,
    hasNext,
    initialIndex: initialMediaIndex,
    currentIndex: activeMediaIndex,
    currentSlideIndex: activeSlideIndex,
    currentNode: activeNode,
    allNodes,
    allSlides,
    slidesKey: nodesKey,
    swiperRef,
    updateActiveSlide,
    setCurrentSlideIndex,
  };
}
