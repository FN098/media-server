"use client";

import { MediaNode } from "@/lib/media/types";
import { useCallback } from "react";

export interface Actions {
  open?: (node: MediaNode) => void | Promise<void>;
  openInNewTab?: (node: MediaNode) => void | Promise<void>;
  openParentFolder?: (node: MediaNode) => void | Promise<void>;
  rename?: (node: MediaNode) => void | Promise<void>;
  move?: (node: MediaNode) => void | Promise<void>;
  copy?: (node: MediaNode) => void | Promise<void>;
  delete?: (node: MediaNode) => void | Promise<void>;
  deletePermanently?: (node: MediaNode) => void | Promise<void>;
  restore?: (node: MediaNode) => void | Promise<void>;
  editTags?: (node: MediaNode) => void | Promise<void>;
  addTagFilter?: (node: MediaNode) => void | Promise<void>;
  changeRating?: (
    node: MediaNode,
    rating: number | null
  ) => void | Promise<void>;
  toggleFavorite?: (node: MediaNode) => void | Promise<void>;
  setAsPreview?: (node: MediaNode) => void | Promise<void>;
  resetPreview?: (node: MediaNode) => void | Promise<void>;
  updateThumb?: (node: MediaNode) => void | Promise<void>;
}

export function useActions(actions: Actions) {
  const hasAction = useCallback(
    (name: keyof Actions) => {
      return typeof actions[name] === "function";
    },
    [actions]
  );

  return {
    actions,
    hasAction,
  };
}
