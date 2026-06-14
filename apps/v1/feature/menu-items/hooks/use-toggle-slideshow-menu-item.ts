import { MenuItemDef, NodeContext } from "@/lib/menu-items/types";
import { PauseIcon, PlayIcon } from "lucide-react";
import { useMemo } from "react";

interface UseToggleSlideshowMenuItemProps {
  toggleSlideshow: () => void | Promise<void>;
  isSlideshowEnabled: boolean;
  isViewerOpen: boolean;
}

export function useToggleSlideshowMenuItem({
  toggleSlideshow,
  isSlideshowEnabled,
  isViewerOpen,
}: UseToggleSlideshowMenuItemProps): MenuItemDef<NodeContext> {
  return useMemo(
    () => ({
      key: "toggle-slideshow",
      type: "action",
      label: isSlideshowEnabled ? "スライドショー停止" : "スライドショー開始",
      icon: isSlideshowEnabled ? PauseIcon : PlayIcon,
      onClick: toggleSlideshow,
      hidden: () => !isViewerOpen,
    }),
    [isSlideshowEnabled, toggleSlideshow, isViewerOpen]
  );
}
