import { MediaNode } from "@/lib/media/types";
import {
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useCallback, useState } from "react";

export interface UseMediaNodeDndProps {
  onDragEnd?: (activeNode: MediaNode, overNode: MediaNode) => void;
}

export function useMediaNodeDnd({ onDragEnd }: UseMediaNodeDndProps) {
  const [activeNode, setActiveNode] = useState<MediaNode | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px以上動かしたらドラッグとみなす（誤クリック防止）
      },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const draggedNode = event.active.data.current?.node as MediaNode;
    if (draggedNode) {
      setActiveNode(draggedNode);
    }
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveNode(null);

      if (!over || active.id === over.id) return;

      const activeNode = active.data.current?.node as MediaNode;
      const overNode = over.data.current?.node as MediaNode;

      if (activeNode && overNode && overNode.isDirectory) {
        onDragEnd?.(activeNode, overNode);
      }
    },
    [onDragEnd]
  );

  return { activeNode, sensors, handleDragStart, handleDragEnd };
}
