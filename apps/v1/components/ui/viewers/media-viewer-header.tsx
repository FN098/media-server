"use client";

import { FavoriteButton } from "@/components/ui/buttons/favorite-button";
import { ViewerHeaderPinButton } from "@/components/ui/buttons/viewer-header-pin-button";
import { ViewerActionsDropdownMenu } from "@/components/ui/dropdown-menus/viewer-actions-dropdown-menu";
import { ClickToCopy } from "@/components/ui/texts/click-to-copy";
import { MarqueeText } from "@/components/ui/texts/marquee-text";
import { isMedia } from "@/lib/media/media-types";
import { MediaNode } from "@/lib/media/types";
import { MenuItemDef, NodeContext } from "@/lib/menu-items/types";
import { useIsMobile } from "@/shadcn-overrides/hooks/use-mobile";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Dispatch, SetStateAction } from "react";

interface MediaViewerHeaderProps {
  visible: boolean;
  currentNode: MediaNode | null;
  currentIndex: number;
  totalCount: number;

  isHeaderPinned: boolean;
  toggleIsHeaderPinned: () => void;

  isHovered: boolean;
  setIsHovered: Dispatch<SetStateAction<boolean>>;

  isMenuOpen: boolean;
  setIsMenuOpen: Dispatch<SetStateAction<boolean>>;

  menuItems?: MenuItemDef<NodeContext>[];

  isFavorite: boolean;
  rating: number | null;

  onToggleFavorite: () => void;
  onClose?: () => void;
}

export function MediaViewerHeader({
  visible,
  currentNode,
  currentIndex,
  totalCount,

  isHeaderPinned,
  toggleIsHeaderPinned,

  setIsHovered,

  isMenuOpen,
  setIsMenuOpen,

  menuItems,

  isFavorite,
  rating,

  onToggleFavorite,
  onClose,
}: MediaViewerHeaderProps) {
  const isMobile = useIsMobile();

  return (
    <AnimatePresence>
      {visible && (
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
          {/* 閉じる */}
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
              {currentIndex + 1} / {totalCount}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <ViewerHeaderPinButton
              enabled={isHeaderPinned}
              onClick={toggleIsHeaderPinned}
            />

            {!!currentNode && isMedia(currentNode.type) && (
              <FavoriteButton
                variant="viewer"
                rating={rating}
                isFavorite={isFavorite}
                onClick={onToggleFavorite}
              />
            )}

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
  );
}
