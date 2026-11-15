"use client";

import { MediaFileNode } from "@/feature/media-file-node/lib/types";
import { createContext, ReactNode, useContext } from "react";

const MediaFileNodesContext = createContext<MediaFileNode[] | undefined>(
  undefined
);

export function MediaFileNodesProvider({
  children,
  nodes,
}: {
  children: ReactNode;
  nodes: MediaFileNode[];
}) {
  return (
    <MediaFileNodesContext.Provider value={nodes}>
      {children}
    </MediaFileNodesContext.Provider>
  );
}

export function useMediaFileNodesContext() {
  const context = useContext(MediaFileNodesContext);
  if (context === undefined) {
    throw new Error(
      "useMediaFileNodesContext must be used within MediaFileNodesProvider"
    );
  }
  return context;
}
