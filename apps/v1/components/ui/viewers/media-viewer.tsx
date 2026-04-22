"use client";

import { APP_CONFIG } from "@/app.config";
import { FavoriteButton } from "@/components/ui/buttons/favorite-button";
import { FavoriteRating } from "@/components/ui/buttons/favorite-rating";
import { ViewerHeaderPinButton } from "@/components/ui/buttons/viewer-header-pin-button";
import { ClickToCopy } from "@/components/ui/texts/click-to-copy";
import { MarqueeText } from "@/components/ui/texts/marquee-text";
import { AudioPlayer } from "@/components/ui/viewers/audio-player";
import { ImageViewer } from "@/components/ui/viewers/image-viewer";
import { VideoPlayer } from "@/components/ui/viewers/video-player";
import { useAutoHidingUI } from "@/hooks/use-auto-hide";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useFullscreen } from "@/hooks/use-fullscreen";
import { isMedia } from "@/lib/media/media-types";
import { MediaNode } from "@/lib/media/types";
import { useFavoritesContext } from "@/providers/favorites-provider";
import { useMediaActionsContext } from "@/providers/media-actions-provider";
import { useViewerHeaderPinnedContext } from "@/providers/viewer-header-pinned-provider";
import { useIsMobile } from "@/shadcn-overrides/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shadcn/components/ui/dropdown-menu";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Folder,
  FolderInput,
  FolderOutput,
  Loader2,
  Maximize,
  MoreVertical,
  RotateCcw,
  TagIcon,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { toast } from "sonner";
import "swiper/css";
import "swiper/css/virtual";
import "swiper/css/zoom";
import { Navigation, Virtual, Zoom } from "swiper/modules";
import { Swiper, SwiperClass, SwiperSlide } from "swiper/react";

type ActionMenuConfig = {
  enabled: {
    pinHeader?: boolean;
    toggleFavorite?: boolean;
    changeRating?: boolean;
    openParentFolder?: boolean;
    openPrevFolder?: boolean;
    openNextFolder?: boolean;
    toggleFullscreen?: boolean;
    editTags?: boolean;
    restore?: boolean;
    delete?: boolean;
    deletePermanently?: boolean;
  };
};

type ActionKey = keyof ActionMenuConfig["enabled"];

interface MediaViewerProps {
  allNodes: MediaNode[];
  initialIndex?: number;
  onIndexChange?: (index: number) => void;
  onClose?: () => void;
  shortcutEnabled?: boolean;
  menuConfig?: ActionMenuConfig;
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
  onIndexChange,
  onClose,
  shortcutEnabled = true,
  menuConfig,
}: MediaViewerProps) {
  const [isPending, startTransition] = useTransition();

  // ===== アクション =====

  const {
    actions: {
      onEditTags,
      onDelete,
      onDeletePermanently,
      onRestore,
      onOpenPrevFolder,
      onOpenNextFolder,
      onOpenParentFolder,
    },
  } = useMediaActionsContext();

  const isEnabled = (key: ActionKey) => !!menuConfig?.enabled[key];

  const handleEditTags = () => {
    if (onEditTags && currentNode) {
      void onEditTags(currentNode);
    }
  };

  const handleRestore = () => {
    if (onRestore && currentNode) {
      void onRestore(currentNode);
    }
  };

  const handleDelete = () => {
    if (onDelete && currentNode) {
      void onDelete(currentNode);
    }
  };

  const handleDeletePermanently = () => {
    if (onDeletePermanently && currentNode) {
      void onDeletePermanently(currentNode);
    }
  };

  const handleOpenPrevFolder = () => {
    if (onOpenPrevFolder && currentNode) {
      void onOpenPrevFolder(currentNode);
    }
  };

  const handleOpenNextFolder = () => {
    if (onOpenNextFolder && currentNode) {
      void onOpenNextFolder(currentNode);
    }
  };

  const handleOpenParent = () => {
    if (onOpenParentFolder && currentNode) {
      void onOpenParentFolder(currentNode);
    }
  };

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
  const [currentNode, setCurrentNode] = useState<MediaNode | null>(
    allNodes[initialIndex] ?? null
  );

  useEffect(() => {
    setCurrentNode(allNodes[initialIndex] ?? null);
  }, [initialIndex, allNodes]);

  const hasPrev = isEnabled("openPrevFolder");
  const hasNext = isEnabled("openNextFolder");

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
      handleOpenPrevFolder();
      return;
    }
    if (hasNext && slide === nextFolderNav) {
      handleOpenNextFolder();
      return;
    }

    // メディアノードの場合のみ状態更新
    let offset = 1; // firstPageDummy
    if (hasPrev) offset += 1; // prevFolderNav
    const index = swiper.activeIndex - offset;
    const node = allNodes[index];
    if (node) {
      setCurrentIndex(index);
      setCurrentNode(node);
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
    setCurrentNode(allNodes[index]);
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

  // ===== ショートカット =====

  // Escape: 閉じる
  useHotkeys("escape", () => onClose!(), {
    scopes: "viewer",
    enabled: shortcutEnabled && !!onClose,
  });

  // Delete: 削除
  useHotkeys("delete", () => handleDelete(), {
    scopes: ["viewer", "tag-editor"],
    enabled: shortcutEnabled && isEnabled("delete"),
  });

  // Enter / Space: ヘッダーの表示切替（固定されていない場合のみ）
  useHotkeys(["enter", "space"], () => toggleHeaderVisibility(), {
    scopes: ["viewer", "tag-editor"],
    enabled: shortcutEnabled && !isHeaderPinned,
  });

  // 左右キー / A, D: 前後のメディアに移動
  useHotkeys(["arrowleft", "a"], () => swiperRef.current!.slidePrev(), {
    scopes: ["viewer", "tag-editor"],
    enabled: shortcutEnabled && !!swiperRef.current,
  });
  useHotkeys(["arrowright", "d"], () => swiperRef.current!.slideNext(), {
    scopes: ["viewer", "tag-editor"],
    enabled: shortcutEnabled && !!swiperRef.current,
  });

  // S: お気に入りの切り替え
  useHotkeys("s", () => handleToggleFavorite(), {
    scopes: ["viewer", "tag-editor"],
    enabled: shortcutEnabled && isEnabled("toggleFavorite"),
  });

  // F: 全画面表示
  useHotkeys("f", () => toggleFullscreen(), {
    scopes: ["viewer", "tag-editor"],
    enabled: shortcutEnabled && isEnabled("toggleFullscreen"),
  });

  // O: フォルダを開く
  useHotkeys("o", () => handleOpenParent(), {
    scopes: ["viewer", "tag-editor"],
    enabled: shortcutEnabled && isEnabled("openParentFolder"),
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
      enabled: shortcutEnabled && isEnabled("pinHeader"),
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
      enabled: shortcutEnabled && isEnabled("changeRating"),
    }
  );

  // ===== その他 =====

  const isMobile = useIsMobile();

  const { toggleFullscreen } = useFullscreen();

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
                <ClickToCopy>
                  <MarqueeText
                    key={currentIndex}
                    text={currentNode?.title ?? currentNode?.name ?? "no title"}
                    autoplay={isMobile}
                    speed={40}
                    delay={1}
                  />
                </ClickToCopy>
              </span>
              <span className="text-white/60 text-sm">
                {currentIndex + 1} / {allNodes.length}
              </span>
            </div>

            <div className="flex items-center gap-4">
              {/* ヘッダー固定ピン */}
              {isEnabled("pinHeader") && (
                <ViewerHeaderPinButton
                  enabled={isHeaderPinned}
                  onClick={toggleIsHeaderPinned}
                />
              )}

              {/* お気に入りボタン */}
              {isEnabled("toggleFavorite") &&
                !!currentNode &&
                isMedia(currentNode.type) && (
                  <FavoriteButton
                    variant="viewer"
                    rating={rating}
                    isFavorite={isFavorite}
                    onClick={handleToggleFavorite}
                    disabled={isPending}
                  />
                )}

              {/* メニュー */}
              <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <button
                    className="p-2 text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full outline-none"
                    aria-label="Open menu"
                  >
                    <MoreVertical size={28} />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  className="flex flex-col min-w-48 gap-2"
                >
                  {isEnabled("changeRating") && (
                    <DropdownMenuItem
                      className="flex justify-center"
                      disabled={!currentNode}
                    >
                      <FavoriteRating
                        value={rating}
                        onChange={handleChangeRating}
                        variant="menu"
                      />
                    </DropdownMenuItem>
                  )}

                  {isEnabled("openParentFolder") && (
                    <DropdownMenuItem
                      onClick={() => handleOpenParent()}
                      disabled={!currentNode}
                    >
                      <Folder className="mr-2 h-4 w-4" />
                      <span>フォルダを開く</span>
                      {!isMobile && (
                        <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 text-xs text-muted-foreground">
                          <kbd className="rounded border px-1.5 py-0.5">O</kbd>
                        </div>
                      )}
                    </DropdownMenuItem>
                  )}

                  {isEnabled("openPrevFolder") && (
                    <DropdownMenuItem
                      onClick={() => handleOpenPrevFolder()}
                      disabled={!hasPrev}
                    >
                      <FolderOutput className="mr-2 h-4 w-4" />
                      <span>前のフォルダを開く</span>
                      {!isMobile && (
                        <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 text-xs text-muted-foreground">
                          <kbd className="rounded border px-1.5 py-0.5">P</kbd>
                        </div>
                      )}
                    </DropdownMenuItem>
                  )}

                  {isEnabled("openNextFolder") && (
                    <DropdownMenuItem
                      onClick={() => handleOpenNextFolder()}
                      disabled={!hasNext}
                    >
                      <FolderInput className="mr-2 h-4 w-4" />
                      <span>次のフォルダを開く</span>
                      {!isMobile && (
                        <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 text-xs text-muted-foreground">
                          <kbd className="rounded border px-1.5 py-0.5">N</kbd>
                        </div>
                      )}
                    </DropdownMenuItem>
                  )}

                  {isEnabled("toggleFullscreen") && (
                    <DropdownMenuItem onClick={toggleFullscreen}>
                      <Maximize className="mr-2 h-4 w-4" />
                      <span>全画面表示</span>
                      {!isMobile && (
                        <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 text-xs text-muted-foreground">
                          <kbd className="rounded border px-1.5 py-0.5">F</kbd>
                        </div>
                      )}
                    </DropdownMenuItem>
                  )}

                  {isEnabled("editTags") && (
                    <DropdownMenuItem
                      onClick={handleEditTags}
                      disabled={!currentNode}
                      className="relative"
                    >
                      <TagIcon className="mr-2 h-4 w-4" />
                      <span>タグを編集</span>
                      {!isMobile && (
                        <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 text-xs text-muted-foreground">
                          <kbd className="rounded border px-1.5 py-0.5">T</kbd>
                        </div>
                      )}
                    </DropdownMenuItem>
                  )}

                  {isEnabled("restore") && (
                    <DropdownMenuItem
                      onClick={handleRestore}
                      disabled={!currentNode}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      <span>復元</span>
                    </DropdownMenuItem>
                  )}

                  {isEnabled("delete") && (
                    <DropdownMenuItem
                      onClick={handleDelete}
                      disabled={!currentNode}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span className="text-destructive">削除</span>
                      {!isMobile && (
                        <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 text-xs text-muted-foreground">
                          <kbd className="rounded border px-1.5 py-0.5">
                            Del
                          </kbd>
                        </div>
                      )}
                    </DropdownMenuItem>
                  )}

                  {isEnabled("deletePermanently") && (
                    <DropdownMenuItem
                      onClick={handleDeletePermanently}
                      disabled={!currentNode}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span className="text-destructive">完全に削除</span>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
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
