"use client";

import { useMediaViewer } from "@/hooks/viewer/use-media-viewer";
import { MediaNode } from "@/lib/media/types";
import { MenuItemDef, NodeContext } from "@/lib/menu-items/types";
import { createContext, useContext } from "react";

const MediaViewerContext = createContext<
  ReturnType<typeof useMediaViewer> | undefined
>(undefined);

interface MediaViewerProviderProps {
  children: React.ReactNode;
  allNodes: MediaNode[];
  initialIndex?: number;
  hotkeysEnabled?: boolean;
  menuItems?: MenuItemDef<NodeContext>[];
  onIndexChange: (index: number) => void;
  onClose: () => void;
  onOpenPrev?: () => void;
  onOpenNext?: () => void;
  onOpenParent?: (node: MediaNode) => void;
  onDelete?: (node: MediaNode) => void;
}

export function MediaViewerProvider({
  children,
  ...rest
}: MediaViewerProviderProps) {
  const value = useMediaViewer(rest);

  return (
    <MediaViewerContext.Provider value={value}>
      {children}
    </MediaViewerContext.Provider>
  );
}

export function useMediaViewerContext() {
  const context = useContext(MediaViewerContext);
  if (context === undefined) {
    throw new Error(
      "useMediaViewerContext must be used within MediaViewerProvider"
    );
  }
  return context;
}
