import { useModifiers } from "@/feature/keyboard/hooks/use-modifiers";
import { MediaNode } from "@/lib/media/types";
import {
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useCallback, useState } from "react";

// 呼び出し側が判定に使えるよう、押されている修飾キーのオブジェクトを定義
export interface DragModifiers {
  ctrlKey: boolean;
  metaKey: boolean; // Mac の Command キー
  shiftKey: boolean;
}

export interface UseMediaNodeDndProps {
  onDragEnd?: (ctx: {
    activeNode: MediaNode;
    overNode: MediaNode;
    modifiers: DragModifiers;
  }) => void;
}

export function useMediaNodeDnd({ onDragEnd }: UseMediaNodeDndProps) {
  const [activeNode, setActiveNode] = useState<MediaNode | null>(null);

  const modifiers = useModifiers();

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
        onDragEnd?.({ activeNode, overNode, modifiers });
      }
    },
    [modifiers, onDragEnd]
  );

  return { activeNode, sensors, handleDragStart, handleDragEnd };
}
