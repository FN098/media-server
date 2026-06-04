import { MenuItemDef, NodeContext } from "@/lib/menu-items/types";
import { FullscreenIcon } from "lucide-react";
import { useMemo } from "react";

interface UseToggleFullscreenMenuItemProps {
  toggleFullscreen: () => void | Promise<void>;
  isViewerOpen: boolean;
  isFullscreenSupported: boolean;
}

export function useToggleFullscreenMenuItem({
  toggleFullscreen,
  isViewerOpen,
  isFullscreenSupported,
}: UseToggleFullscreenMenuItemProps): MenuItemDef<NodeContext> {
  return useMemo(
    () => ({
      key: "toggle-fullscreen",
      type: "action",
      icon: FullscreenIcon,
      label: "全画面",
      onClick: () => void toggleFullscreen(),
      hidden: () => !isViewerOpen || !isFullscreenSupported,
      kbd: "F",
    }),
    [toggleFullscreen, isViewerOpen, isFullscreenSupported]
  );
}
