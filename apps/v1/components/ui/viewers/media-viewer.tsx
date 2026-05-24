"use client";

import { APP_CONFIG } from "@/app.config";
import { MediaViewerHeader } from "@/components/ui/viewers/components/media-viewer-header";
import { MediaViewerSlides } from "@/components/ui/viewers/components/media-viewer-slides";
import { useMediaViewerFavorite } from "@/components/ui/viewers/hooks/use-media-viewer-favorite";
import { useMediaViewerHotkeys } from "@/components/ui/viewers/hooks/use-media-viewer-hotkeys";
import { useMediaViewerNavigation } from "@/components/ui/viewers/hooks/use-media-viewer-navigation";
import { useAutoHidingUI } from "@/hooks/use-auto-hide";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { MediaNode } from "@/lib/media/types";
import { MenuItemDef, NodeContext } from "@/lib/menu-items/types";
import { useViewerHeaderPinnedContext } from "@/providers/viewer-header-pinned-provider";
import { useCallback, useEffect, useState } from "react";
import "swiper/css";
import "swiper/css/virtual";
import "swiper/css/zoom";

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
