"use client";

import { APP_CONFIG } from "@/app.config";
import { FavoriteButton } from "@/components/ui/buttons/favorite-button";
import { ViewerHeaderPinButton } from "@/components/ui/buttons/viewer-header-pin-button";
import { ViewerActionsDropdownMenu } from "@/components/ui/dropdown-menus/viewer-actions-dropdown-menu";
import { ClickToCopy } from "@/components/ui/texts/click-to-copy";
import { MarqueeText } from "@/components/ui/texts/marquee-text";
import { AudioPlayer } from "@/components/ui/viewers/audio-player";
import { ImageViewer } from "@/components/ui/viewers/image-viewer";
import { VideoPlayer } from "@/components/ui/viewers/video-player";
import { useAutoHidingUI } from "@/hooks/use-auto-hide";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { isMedia } from "@/lib/media/media-types";
import { MediaNode } from "@/lib/media/types";
import { MenuItemDef } from "@/lib/menu-items/types";
import { useFavoritesContext } from "@/providers/favorites-provider";
import { useViewerHeaderPinnedContext } from "@/providers/viewer-header-pinned-provider";
import { useIsMobile } from "@/shadcn-overrides/hooks/use-mobile";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
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
  menuItems?: MenuItemDef[];
  onIndexChange?: (index: number) => void;
  onClose?: () => void;
  onOpenPrev?: () => void;
  onOpenNext?: () => void;
  onOpenParent?: (node: MediaNode) => void;
  onDelete?: (node: MediaNode) => void;
}

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

  // ===== スライド移動 =====

  const [currentIndex, setCurrentIndex] = useState<number>(initialIndex);

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

  // 仮想スライド構成
  // [最初のページダミー] → [前のフォルダナビ] → [メディア配列] → [次のフォルダナビ] → [最後のページダミー]
  const allSlides = useMemo(() => {
    const slides: Slide[] = [...allNodes];

    // 前側のスライドを追加
    if (hasPrev) {
      slides.unshift(firstPageDummy);
      slides.unshift(prevFolderNav);
    } else {
      slides.unshift(firstPageDummy);
    }

    // 後側のスライドを追加
    if (hasNext) {
      slides.push(lastPageDummy);
      slides.push(nextFolderNav);
    } else {
      slides.push(lastPageDummy);
    }

    return slides;
  }, [allNodes, hasPrev, hasNext]);

  // 実際のメディアインデックスからスライドインデックスへの変換
  const getSlideIndex = (mediaIndex: number): number => {
    let offset = 1; // firstPageDummy
    if (hasPrev) offset += 1; // prevFolderNav
    return mediaIndex + offset;
  };

  // スワイプ制御用
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(
    getSlideIndex(initialIndex)
  );

  // スワイプ時の移動処理
  const handleSwipe = (swiper: SwiperClass) => {
    setCurrentSlideIndex(swiper.activeIndex);

    const slide = allSlides[swiper.activeIndex];

    // ダミーページの場合は何もしない
    if (slide === firstPageDummy || slide === lastPageDummy) {
      return;
    }

    // フォルダ遷移
    if (hasPrev && slide === prevFolderNav) {
      onOpenPrev();
      return;
    }
    if (hasNext && slide === nextFolderNav) {
      onOpenNext();
      return;
    }

    // メディアノードの場合のみ状態更新
    let offset = 1; // firstPageDummy
    if (hasPrev) offset += 1; // prevFolderNav
    const index = swiper.activeIndex - offset;
    const node = allNodes[index];
    if (node) {
      setCurrentIndex(index);
      updateTitle(node);
      onIndexChange?.(index);

      lastViewedPathRef.current = node.path;
    }
  };

  // ===== タイトル =====

  const { setTitle } = useDocumentTitle();

  // タイトルにファイルタイトルまたはファイル名を設定
  const updateTitle = (node: MediaNode) => {
    const { title, name } = node;
    setTitle(`${title ?? name} | ${APP_CONFIG.meta.title}`);
  };

  // ===== お気に入り =====

  const { toggleFavorite, updateFavorite, getFavorite } = useFavoritesContext();

  const { isFavorite = false, rating = null } = currentNode
    ? getFavorite(currentNode.path)
    : {};

  // お気に入り状態トグル
  const handleToggleFavorite = () => {
    startTransition(async () => {
      try {
        if (!currentNode) return;
        const { isFavorite } = getFavorite(currentNode.path);
        const nextIsFavorite = !isFavorite;

        await toggleFavorite(currentNode.path);

        const message = nextIsFavorite
          ? "⭐お気に入りに登録しました"
          : "お気に入りを解除しました";
        toast.info(message, { duration: 1000 });

        interactHeader();
      } catch (e) {
        console.error(e);
        toast.error("お気に入りの更新に失敗しました");
      }
    });
  };

  // レーティングを更新
  const handleChangeRating = (rating: number | null) => {
    startTransition(async () => {
      try {
        if (!currentNode) return;
        const node = currentNode;

        await updateFavorite(node.path, rating);

        const message =
          rating != null
            ? "⭐レーティングを更新しました"
            : "レーティングを解除しました";
        toast.info(message, { duration: 1000 });

        interactHeader();
      } catch (e) {
        console.error(e);
        toast.error("お気に入りの更新に失敗しました");
      }
    });
  };

  // ===== ナビゲーション =====

  // リスト更新時に直前に見ていたファイルを復元
  useEffect(() => {
    const path = lastViewedPathRef.current;
    if (!path) return;

    const index = allNodes.findIndex((n) => n.path === path);
    if (index === -1) return;
    if (index === currentIndex) return;

    const slideIndex = getSlideIndex(index);

    setCurrentIndex(index);
    setCurrentSlideIndex(slideIndex);
    updateTitle(allNodes[index]);
    onIndexChange?.(index);

    swiperRef.current?.slideTo(slideIndex, 0);

    // eslint-disable-next-line react-hooks/exhaustive-deps -- この処理は allNodes だけに依存させる
  }, [allNodes]);

  // ===== ズーム =====

  // マウスホイールでズーム
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

  // ===== モバイル =====

  const isMobile = useIsMobile();

  // ===== ショートカット =====

  // Escape / Backspace: 閉じる
  useHotkeys(["escape", "backspace"], () => onClose!(), {
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
  useHotkeys("s", () => handleToggleFavorite(), {
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
      handleChangeRating(rating === 0 ? null : rating);
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
              aria-label="Close viewer"
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
                  onClick={handleToggleFavorite}
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
        noSwiping={true}
        noSwipingSelector=".swiper-no-swiping"
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
                    {hasPrev && (
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
                    {hasNext && (
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
