"use client";

import { APP_CONFIG } from "@/app.config";
import { FavoriteButton } from "@/components/ui/buttons/favorite-button";
import { ViewerHeaderPinButton } from "@/components/ui/buttons/viewer-header-pin-button";
import { ViewerActionsDropdownMenu } from "@/components/ui/dropdown-menus/viewer-actions-dropdown-menu";
import { ClickToCopy } from "@/components/ui/texts/click-to-copy";
import { MarqueeText } from "@/components/ui/texts/marquee-text";
import {
  ContentSlide,
  buildMediaViewerSlides,
  getMediaIndex,
  getSlideIndex,
} from "@/components/ui/viewers/lib/media-viewer/slides";
import { MediaViewerSlideRenderer } from "@/components/ui/viewers/media-viewer-slide-renderer";
import { useAutoHidingUI } from "@/hooks/use-auto-hide";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { isMedia } from "@/lib/media/media-types";
import { MediaNode } from "@/lib/media/types";
import { MenuItemDef, NodeContext } from "@/lib/menu-items/types";
import { useFavoritesContext } from "@/providers/favorites-provider";
import { useViewerHeaderPinnedContext } from "@/providers/viewer-header-pinned-provider";
import { useIsMobile } from "@/shadcn-overrides/hooks/use-mobile";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { toast } from "sonner";
import "swiper/css";
import "swiper/css/virtual";
import "swiper/css/zoom";
import { Navigation, Virtual, Zoom } from "swiper/modules";
import { Swiper, SwiperClass, SwiperSlide } from "swiper/react";

interface MediaViewerProps {
  allNodes: MediaNode[];
  initialIndex?: number;
  shortcutEnabled?: boolean;
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
  shortcutEnabled = true,
  menuItems,
  onIndexChange,
  onClose,
  onOpenPrev,
  onOpenNext,
  onOpenParent,
  onDelete,
}: MediaViewerProps) {
  const [isPending, startTransition] = useTransition();

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

  // ===== ナビゲーション =====

  const [currentIndex, setCurrentIndex] = useState<number>(initialIndex);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const currentNode = useMemo(
    () => allNodes[currentIndex] ?? null,
    [allNodes, currentIndex]
  );

  const hasPrev = !!onOpenPrev;
  const hasNext = !!onOpenNext;

  const swiperRef = useRef<SwiperClass | null>(null);
  const lastViewedPathRef = useRef<string | null>(
    allNodes[initialIndex]?.path ?? null
  );

  const allSlides = useMemo(
    () => buildMediaViewerSlides({ nodes: allNodes, hasPrev, hasNext }),
    [allNodes, hasPrev, hasNext]
  );

  // ===== タイトル =====

  const { setTitle } = useDocumentTitle();

  // タイトルにファイルタイトルまたはファイル名を設定
  const updateTitle = useCallback(
    (node: MediaNode) => {
      setTitle(`${node.title ?? node.name} | ${APP_CONFIG.meta.title}`);
    },
    [setTitle]
  );

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

      startTransition(() => {});

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
  }, [
    currentNode,
    getFavorite,
    toggleFavorite,
    interactHeader,
    startTransition,
  ]);

  // レーティングを更新
  const handleChangeRating = useCallback(
    async (rating: number | null) => {
      if (!currentNode) return;

      try {
        await updateFavorite(currentNode.path, rating);

        startTransition(() => {});

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
    [currentNode, updateFavorite, interactHeader, startTransition]
  );

  // ===== スワイプ =====

  // スワイプ時の移動処理
  const handleSwipe = useCallback(
    (swiper: SwiperClass) => {
      debugger;
      setCurrentSlideIndex(swiper.activeIndex);

      const slide = allSlides[swiper.activeIndex];
      if (!slide) return;

      if (slide.type === "empty") return;

      if (slide.type === "navigation") {
        if (slide.direction === "prev") onOpenPrev?.();
        if (slide.direction === "next") onOpenNext?.();
        return;
      }

      const index = getMediaIndex(swiper.activeIndex, hasPrev);
      const node = allNodes[index];
      if (!node) return;

      setCurrentIndex(index);
      updateTitle(node);
      onIndexChange?.(index);
      lastViewedPathRef.current = node.path;
    },
    [
      allSlides,
      hasPrev,
      allNodes,
      updateTitle,
      onIndexChange,
      onOpenPrev,
      onOpenNext,
    ]
  );

  // ===== 復元 =====

  // リスト更新時に直前に見ていたファイルを復元
  useEffect(() => {
    const path = lastViewedPathRef.current;
    if (!path) return;

    const index = allNodes.findIndex((n) => n.path === path);
    if (index === -1 || index === currentIndex) return;

    const slideIndex = getSlideIndex(index, hasPrev);

    setCurrentIndex(index);
    setCurrentSlideIndex(slideIndex);
    updateTitle(allNodes[index]);
    onIndexChange?.(index);

    swiperRef.current?.slideTo(slideIndex, 0);
  }, [allNodes, currentIndex, hasPrev, onIndexChange, updateTitle]);

  // ===== モバイル =====

  const isMobile = useIsMobile();

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
    []
  );

  // ===== オーディオ =====

  const [isRepeating, setIsRepeating] = useState(false);

  // ===== ショートカット =====

  // Escape / Backspace: 閉じる
  useHotkeys(["escape", "backspace"], () => onClose?.(), {
    scopes: "viewer",
    enabled: shortcutEnabled && !!onClose,
  });

  // Delete: 削除
  useHotkeys("delete", () => onDelete?.(currentNode), {
    scopes: ["viewer", "tag-editor"],
    enabled: shortcutEnabled && !!currentNode,
  });

  // Enter / Space: ヘッダーの表示切替（固定されていない場合のみ）
  useHotkeys(["enter", "space"], () => toggleHeaderVisibility(), {
    scopes: ["viewer", "tag-editor"],
    enabled: shortcutEnabled && !isHeaderPinned,
  });

  // 左右キー / A, D: 前後のメディアに移動
  useHotkeys(["arrowleft", "a"], () => swiperRef.current?.slidePrev(), {
    scopes: ["viewer", "tag-editor"],
    enabled: shortcutEnabled,
  });

  useHotkeys(["arrowright", "d"], () => swiperRef.current?.slideNext(), {
    scopes: ["viewer", "tag-editor"],
    enabled: shortcutEnabled,
  });

  // S: お気に入りの切り替え
  useHotkeys("s", () => void handleToggleFavorite(), {
    scopes: ["viewer", "tag-editor"],
    enabled: shortcutEnabled,
  });

  // O: フォルダを開く
  useHotkeys("o", () => onOpenParent?.(currentNode), {
    scopes: ["viewer", "tag-editor"],
    enabled: shortcutEnabled && !!currentNode,
  });

  // H: ヘッダーの固定切り替え
  useHotkeys(
    "h",
    () => {
      toggleIsHeaderPinned();
      interactHeader();
    },
    {
      scopes: ["viewer", "tag-editor"],
      enabled: shortcutEnabled,
    }
  );

  // 0~5: お気に入り評価の設定
  useHotkeys(
    "0,1,2,3,4,5",
    (event) => {
      const rating = parseInt(event.key);
      void handleChangeRating(rating === 0 ? null : rating);
    },
    {
      scopes: ["viewer", "tag-editor"],
      enabled: shortcutEnabled,
    }
  );

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden touch-none bg-black select-none">
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
            {/* 閉じるボタン */}
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
                {currentIndex + 1} / {allNodes.length}
              </span>
            </div>

            <div className="flex items-center gap-4">
              {/* ヘッダー固定ピン */}
              <ViewerHeaderPinButton
                enabled={isHeaderPinned}
                onClick={toggleIsHeaderPinned}
              />

              {/* お気に入りボタン */}
              {!!currentNode && isMedia(currentNode.type) && (
                <FavoriteButton
                  variant="viewer"
                  rating={rating}
                  isFavorite={isFavorite}
                  onClick={() => void handleToggleFavorite()}
                  disabled={isPending}
                />
              )}

              {/* メニュー */}
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

      {/* メディアコンテンツ */}
      <Swiper
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
          setCurrentSlideIndex(swiper.activeIndex);
        }}
        modules={[Virtual, Navigation, Zoom]}
        initialSlide={getSlideIndex(initialIndex, hasPrev)}
        onSlideChange={handleSwipe}
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
