"use client";

import { APP_CONFIG } from "@/app.config";
import { useMediaViewerHotkeys } from "@/components/ui/viewers/hooks/use-media-viewer-hotkeys";
import { useMediaViewerNavigation } from "@/components/ui/viewers/hooks/use-media-viewer-navigation";
import {
  ContentSlide,
  getSlideIndex,
} from "@/components/ui/viewers/lib/media-viewer/slides";
import { MediaViewerHeader } from "@/components/ui/viewers/media-viewer-header";
import { MediaViewerSlideRenderer } from "@/components/ui/viewers/media-viewer-slide-renderer";
import { useAutoHidingUI } from "@/hooks/use-auto-hide";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { MediaNode } from "@/lib/media/types";
import { MenuItemDef, NodeContext } from "@/lib/menu-items/types";
import { useFavoritesContext } from "@/providers/favorites-provider";
import { useViewerHeaderPinnedContext } from "@/providers/viewer-header-pinned-provider";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
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

  // 初回マウント時にタイトル設定
  useEffect(() => {
    if (currentNode) updateTitle(currentNode);
  }, [currentNode, updateTitle]);

  // ===== お気に入り =====

  const { toggleFavorite, updateFavorite, getFavorite } = useFavoritesContext();

  const { isFavorite = false, rating = null } = currentNode
    ? getFavorite(currentNode.path)
    : {};

  // お気に入り状態トグル
  const handleToggleFavorite = useCallback(async () => {
    if (!currentNode) return;

    try {
      const { isFavorite } = getFavorite(currentNode.path);
      const nextIsFavorite = !isFavorite;

      await toggleFavorite(currentNode.path);

      toast.info(
        nextIsFavorite
          ? "⭐お気に入りに登録しました"
          : "お気に入りを解除しました",
        { duration: 1000 }
      );

      interactHeader();
    } catch (e) {
      console.error(e);
      toast.error("お気に入りの更新に失敗しました");
    }
  }, [currentNode, getFavorite, toggleFavorite, interactHeader]);

  // レーティングを更新
  const handleChangeRating = useCallback(
    async (rating: number | null) => {
      if (!currentNode) return;

      try {
        await updateFavorite(currentNode.path, rating);

        toast.info(
          rating != null
            ? "⭐レーティングを更新しました"
            : "レーティングを解除しました",
          { duration: 1000 }
        );

        interactHeader();
      } catch (e) {
        console.error(e);
        toast.error("お気に入りの更新に失敗しました");
      }
    },
    [currentNode, updateFavorite, interactHeader]
  );

  // ===== 画像 =====

  // マウスホイールでズーム
  const handleWheel = useCallback(
    (e: React.WheelEvent, slide: ContentSlide) => {
      if (slide.node.type !== "image") return;

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
    },
    [swiperRef]
  );

  // ===== オーディオ =====

  const [isRepeating, setIsRepeating] = useState(false);

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
    onToggleFavorite: () => void handleToggleFavorite(),
    onChangeRating: (rating) => void handleChangeRating(rating),
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
        onToggleFavorite={() => void handleToggleFavorite()}
        onClose={onClose}
      />

      {/* メディアコンテンツ */}
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
    </div>
  );
}
