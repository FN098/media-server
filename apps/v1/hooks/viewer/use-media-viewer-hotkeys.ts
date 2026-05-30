import { MediaNode } from "@/lib/media/types";
import { useHotkeys } from "react-hotkeys-hook";
import { SwiperClass } from "swiper/react";

interface UseMediaViewerHotkeysProps {
  enabled: boolean;

  swiperRef: React.RefObject<SwiperClass | null>;
  currentNode: MediaNode | null;

  isHeaderPinned: boolean;
  toggleHeaderVisibility: () => void;

  toggleIsHeaderPinned: () => void;
  interactHeader: () => void;

  onClose?: () => void;
  onDelete?: (node: MediaNode) => void;
  onOpenParent?: (node: MediaNode) => void;

  onToggleFavorite: () => void;
  onChangeRating: (rating: number | null) => void;
}

export function useMediaViewerHotkeys({
  enabled,
  swiperRef,
  currentNode,
  isHeaderPinned,
  toggleHeaderVisibility,
  toggleIsHeaderPinned,
  interactHeader,
  onClose,
  onDelete,
  onOpenParent,
  onToggleFavorite,
  onChangeRating,
}: UseMediaViewerHotkeysProps) {
  useHotkeys(["escape", "backspace"], () => onClose?.(), {
    scopes: "viewer",
    enabled: enabled && !!onClose,
  });

  useHotkeys("delete", () => currentNode && onDelete?.(currentNode), {
    scopes: ["viewer", "tag-editor"],
    enabled: enabled && !!currentNode,
  });

  useHotkeys(["enter", "space"], () => toggleHeaderVisibility(), {
    scopes: ["viewer", "tag-editor"],
    enabled: enabled && !isHeaderPinned,
  });

  useHotkeys(["arrowleft", "a"], () => swiperRef.current?.slidePrev(), {
    scopes: ["viewer", "tag-editor"],
    enabled: enabled,
  });

  useHotkeys(["arrowright", "d"], () => swiperRef.current?.slideNext(), {
    scopes: ["viewer", "tag-editor"],
    enabled: enabled,
  });

  useHotkeys("s", () => onToggleFavorite(), {
    scopes: ["viewer", "tag-editor"],
    enabled: enabled,
  });

  useHotkeys("o", () => currentNode && onOpenParent?.(currentNode), {
    scopes: ["viewer", "tag-editor"],
    enabled: enabled && !!currentNode,
  });

  useHotkeys(
    "h",
    () => {
      toggleIsHeaderPinned();
      interactHeader();
    },
    {
      scopes: ["viewer", "tag-editor"],
      enabled: enabled,
    }
  );

  useHotkeys(
    "0,1,2,3,4,5",
    (event) => {
      const rating = parseInt(event.key);
      onChangeRating(rating === 0 ? null : rating);
    },
    {
      scopes: ["viewer", "tag-editor"],
      enabled: enabled,
    }
  );
}
