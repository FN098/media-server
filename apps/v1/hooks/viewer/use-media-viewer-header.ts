import { useVisibility } from "@/hooks/general/use-visibility";
import { useViewerHeaderPinnedContext } from "@/providers/viewer-header-pinned-provider";
import { useCallback, useState } from "react";

export function useMediaViewerHeader() {
  const [isHovered, setIsHovered] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const pinned = useViewerHeaderPinnedContext();

  const visibility = useVisibility({
    autoHide: {
      enabled: !(isHovered || isMenuOpen || pinned.enabled),
      duration: 2000,
    },
  });

  const interact = useCallback(() => {
    visibility.show();
    visibility.debouncedHide();
  }, [visibility]);

  return {
    isHovered,
    setIsHovered,
    isMenuOpen,
    setIsMenuOpen,
    pinned,
    visibility,
    interact,
  };
}

export type MediaViewerHeaderContext = ReturnType<typeof useMediaViewerHeader>;
