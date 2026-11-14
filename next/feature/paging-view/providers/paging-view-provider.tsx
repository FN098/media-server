"use client";

import { MediaNode } from "@/feature/media-node/lib/types";
import { Modifiers } from "@dnd-kit/core";
import { createContext, useContext } from "react";

interface PagingViewProps {
  allNodes: MediaNode[];
  initialScrollId?: string | null;
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

const PagingViewContext = createContext<PagingViewProps | undefined>(undefined);

interface PagingViewProvider extends PagingViewProps {
  children: React.ReactNode;
}

export function PagingViewProvider({ children, ...props }: PagingViewProvider) {
  return (
    <PagingViewContext.Provider value={props}>
      {children}
    </PagingViewContext.Provider>
  );
}

export function usePagingViewContext() {
  const context = useContext(PagingViewContext);
  if (context === undefined) {
    throw new Error(
      "usePagingViewContext must be used within PagingViewProvider"
    );
  }
  return context;
}
