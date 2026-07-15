import { Modifiers } from "@/feature/keyboard/hooks/use-modifiers";
import { MediaNode } from "@/lib/media/types";

export interface UseMediaNodePagingViewProps {
  allNodes: MediaNode[];
  initialScrollPath?: string | null;
  focusOnPageChange?: boolean;
  onPageChange?: (page: number) => void;
  onScrollRestored?: () => void;
  onSelectionChange?: () => void;
  onOpen?: (node: MediaNode) => void;
  onThumbError?: (node: MediaNode) => void;
  onDragEnd?: (ctx: {
    activeNode: MediaNode;
    overNode: MediaNode;
    modifiers: Modifiers;
  }) => void;
}

export function useMediaNodePagingView(props: UseMediaNodePagingViewProps) {
  return { ...props };
}

export type MediaNodePagingView = ReturnType<typeof useMediaNodePagingView>;
