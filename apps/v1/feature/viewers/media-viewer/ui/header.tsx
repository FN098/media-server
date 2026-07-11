"use client";

import { FavoriteButton } from "@/feature/favorite/ui/favorite-button";
import { NodeDropdownMenu } from "@/feature/menu/ui/node-dropdown-menu";
import { ClickToCopy } from "@/feature/text/ui/click-to-copy";
import { MarqueeText } from "@/feature/text/ui/marquee-text";
import { useMediaViewerContext } from "@/feature/viewers/media-viewer/providers/media-viewer-provider";
import { MediaViewerHeaderPinButton } from "@/feature/viewers/media-viewer/ui/pin-button";
import { isMedia } from "@/lib/media/detectors";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

export function MediaViewerHeader() {
  const {
    navigation: { allNodes, currentIndex, currentNode },
    header: {
      setIsHovered,
      pinned,
      visibility: { isVisible },
      isMenuOpen,
      setIsMenuOpen,
    },
    menuItems,
    onClose,
    favorite: { rating, isFavorite, toggleFavorite },
    slideshow,
  } = useMediaViewerContext();

  return (
    <AnimatePresence>
      {isVisible && (
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
          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full mr-4"
          >
            <ArrowLeft size={28} />
          </button>

          <div className="flex flex-col gap-1 ml-4 mr-4 flex-1 min-w-0 select-text">
            <span className="text-white md:text-lg font-medium drop-shadow-md">
              <MarqueeText key={currentIndex} speed={40} delay={1}>
                <ClickToCopy>
                  {currentNode?.title ?? currentNode?.name ?? "no title"}
                </ClickToCopy>
              </MarqueeText>
            </span>
            <span className="text-white/60 text-sm flex items-center gap-2">
              {allNodes.length > 0
                ? `${currentIndex + 1} / ${allNodes.length}`
                : "-"}

              {slideshow.enabled && (
                <motion.span
                  animate={{
                    opacity: [0.6, 1, 0.6],
                    scale: [1, 1.15, 1],
                  }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="h-2.5 w-2.5 rounded-full bg-lime-400 shadow-[0_0_12px_rgba(163,230,53,0.9)]"
                />
              )}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <MediaViewerHeaderPinButton
              isPinned={pinned.enabled}
              onClick={pinned.toggle}
            />

            {!!currentNode && isMedia(currentNode.type) && (
              <FavoriteButton
                size="large"
                rating={rating}
                isFavorite={isFavorite}
                onClick={() => void toggleFavorite()}
              />
            )}

            {currentNode && (
              <NodeDropdownMenu
                node={currentNode}
                menuItems={menuItems}
                open={isMenuOpen}
                onOpenChange={setIsMenuOpen}
                variant="large"
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
