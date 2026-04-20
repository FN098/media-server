"use client";

import { MediaNode } from "@/lib/media/types";
import { useCallback } from "react";

export interface MediaActions {
  onOpen?: (node: MediaNode) => void | Promise<void>;
  onOpenInNewTab?: (node: MediaNode) => void | Promise<void>;
  onOpenParentFolder?: (node: MediaNode) => void | Promise<void>;
  onRename?: (node: MediaNode) => void | Promise<void>;
  onMove?: (node: MediaNode) => void | Promise<void>;
  onCopy?: (node: MediaNode) => void | Promise<void>;
  onDelete?: (node: MediaNode) => void | Promise<void>;
  onDeletePermanently?: (node: MediaNode) => void | Promise<void>;
  onRestore?: (node: MediaNode) => void | Promise<void>;
  onEditTags?: (node: MediaNode) => void | Promise<void>;
  onAddTagFilter?: (node: MediaNode) => void | Promise<void>;
  onChangeRating?: (
    node: MediaNode,
    rating: number | null
  ) => void | Promise<void>;
  onToggleFavorite?: (node: MediaNode) => void | Promise<void>;
  onSetAsPreview?: (node: MediaNode) => void | Promise<void>;
  onUpdateThumb?: (node: MediaNode) => void | Promise<void>;
}

export function useMediaActions(actions: MediaActions) {
  const hasAction = useCallback(
    (name: keyof MediaActions) => {
      return typeof actions[name] === "function";
    },
    [actions]
  );

  return {
    actions,
    hasAction,
  };
}
