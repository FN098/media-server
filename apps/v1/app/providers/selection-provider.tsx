"use client";

import { useSelection, UseSelectionReturn } from "@/app/hooks/use-selection";
import { MediaFsNode } from "@/app/lib/types";
import { createContext, useContext } from "react";

const MediaFsNodeSelectionContext =
  createContext<UseSelectionReturn<MediaFsNode> | null>(null);

export const MediaFsNodeSelectionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const selection = useSelection<MediaFsNode>();
  return (
    <MediaFsNodeSelectionContext.Provider value={selection}>
      {children}
    </MediaFsNodeSelectionContext.Provider>
  );
};

export const useMediaFsNodeSelection = () => {
  const context = useContext(MediaFsNodeSelectionContext);
  if (!context)
    throw new Error(
      "useMediaFsNodeSelection must be used within MediaFsNodeSelectionProvider"
    );
  return context;
};
