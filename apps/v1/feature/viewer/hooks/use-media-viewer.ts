// hooks/viewer/use-media-viewer.ts
import { APP_CONFIG } from "@/app.config";
import { useDocumentTitle } from "@/feature/general/hooks/use-document-title";
import { useAudioRepeating } from "@/feature/viewer/hooks/use-audio-repeating";
import { useMediaViewerFavorite } from "@/feature/viewer/hooks/use-media-viewer-favorite";
import { useMediaViewerHeader } from "@/feature/viewer/hooks/use-media-viewer-header";
import { useMediaViewerHotkeys } from "@/feature/viewer/hooks/use-media-viewer-hotkeys";
import { useMediaViewerNavigation } from "@/feature/viewer/hooks/use-media-viewer-navigation";
import { useSlideshowContext } from "@/feature/viewer/providers/slideshow-provider";
import { MediaNode } from "@/lib/media/types";
import { MenuItemDef, NodeContext } from "@/lib/menu-items/types";
import { useCallback, useEffect } from "react";

export interface UseMediaViewerProps {
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

export function useMediaViewer({
  allNodes,
  initialIndex = 0,
  hotkeysEnabled = true,
  menuItems = [],
  onIndexChange,
  onClose,
  onOpenPrev,
  onOpenNext,
  onOpenParent,
  onDelete,
}: UseMediaViewerProps) {
  // ===== ヘッダー表示 =====

  const header = useMediaViewerHeader();

  // ===== タイトル =====

  const { setTitle } = useDocumentTitle();

  const updateTitle = useCallback(
    (node: MediaNode) => {
      setTitle(`${node.title ?? node.name} | ${APP_CONFIG.meta.title}`);
    },
    [setTitle]
  );

  // ===== ナビゲーション =====

  const navigation = useMediaViewerNavigation({
    allNodes,
    initialIndex,
    onIndexChange,
    onOpenPrev,
    onOpenNext,
    onNodeChange: updateTitle,
  });

  const { currentNode } = navigation;

  // ===== お気に入り =====

  const favorite = useMediaViewerFavorite({
    currentNode,
    onChange: header.interact,
  });

  // ===== スライドショー =====

  const slideshow = useSlideshowContext();

  // ===== 音声リピート =====

  const audioRepeating = useAudioRepeating();

  // スライドショーON時はリピートをOFF
  useEffect(() => {
    if (slideshow.enabled) {
      audioRepeating.setEnabled(false);
    }
  }, [audioRepeating, slideshow.enabled]);

  // ===== ショートカット =====

  useMediaViewerHotkeys({
    enabled: hotkeysEnabled,
    swiperRef: navigation.swiperRef,
    currentNode,
    isHeaderPinned: header.pinned.enabled,
    toggleHeaderVisibility: header.visibility.toggle,
    toggleIsHeaderPinned: header.pinned.toggle,
    interactHeader: header.interact,
    onClose,
    onDelete,
    onOpenParent,
    onToggleFavorite: () => void favorite.toggleFavorite(),
    onChangeRating: (rating) => void favorite.changeRating(rating),
  });

  return {
    header,
    menuItems,
    navigation,
    favorite,
    slideshow,
    audioRepeating,
    onClose,
  };
}

export type MediaViewerContext = ReturnType<typeof useMediaViewer>;
