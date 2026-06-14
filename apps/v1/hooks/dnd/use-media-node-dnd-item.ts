import { MediaNode } from "@/lib/media/types";
import { useMediaNodeDndContext } from "@/providers/media-node-dnd-provider";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { useCallback } from "react";

interface UseMediaNodeDndItemProps {
  node: MediaNode;
}

export function useMediaNodeDndItem({ node }: UseMediaNodeDndItemProps) {
  const { activeNode } = useMediaNodeDndContext();

  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({
    id: `drag-${node.path}`,
    data: { node },
  });

  const isSelfDragging = activeNode?.path === node.path;

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `drop-${node.path}`,
    disabled: !node.isDirectory || isSelfDragging,
    data: { node },
  });

  const setDndRef = useCallback(
    (element: HTMLElement | null) => {
      setDragRef(element);
      setDropRef(element);
    },
    [setDragRef, setDropRef]
  );

  return {
    attributes,
    listeners,
    isDragging,
    isOver,
    setDndRef,
  };
}
