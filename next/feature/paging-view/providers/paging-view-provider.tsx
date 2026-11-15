"use client";

import { MediaFileNode } from "@/feature/media-file-node/lib/types";
import { Modifiers } from "@dnd-kit/core";
import { createContext, useContext } from "react";

interface PagingViewProps {
  allNodes: MediaFileNode[];
  initialScrollId?: string | null;
  focusOnPageChange?: boolean;
  onPageChange?: (page: number) => void;
  onScrollRestored?: () => void;
  onSelectionChange?: () => void;
  onOpen?: (node: MediaFileNode) => void;
  onThumbError?: (node: MediaFileNode) => void;
  onDragEnd?: (ctx: {
    activeNode: MediaFileNode;
    overNode: MediaFileNode;
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
