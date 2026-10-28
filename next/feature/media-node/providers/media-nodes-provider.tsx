"use client";

import { MediaNode } from "@/feature/media-node/lib/types";
import { createContext, ReactNode, useContext } from "react";

const MediaNodesContext = createContext<MediaNode[] | undefined>(undefined);

export function MediaNodesProvider({
  children,
  nodes,
}: {
  children: ReactNode;
  nodes: MediaNode[];
}) {
  return (
    <MediaNodesContext.Provider value={nodes}>
      {children}
    </MediaNodesContext.Provider>
  );
}

export function useMediaNodesContext() {
  const context = useContext(MediaNodesContext);
  if (context === undefined) {
    throw new Error(
      "useMediaNodesContext must be used within MediaNodesProvider"
    );
  }
  return context;
}
