"use client";

import {
  UseMediaNodeViewItemProps,
  useMediaNodeViewItem,
} from "@/hooks/view/use-media-node-view-item";
import { createContext, useContext } from "react";

const MediaNodeViewItemContext = createContext<
  ReturnType<typeof useMediaNodeViewItem> | undefined
>(undefined);

interface MediaNodeViewItemProvider extends UseMediaNodeViewItemProps {
  children: React.ReactNode;
}

export function MediaNodeViewItemProvider({
  children,
  ...props
}: MediaNodeViewItemProvider) {
  const value = useMediaNodeViewItem(props);

  return (
    <MediaNodeViewItemContext.Provider value={value}>
      {children}
    </MediaNodeViewItemContext.Provider>
  );
}

export function useMediaNodeViewItemContext() {
  const context = useContext(MediaNodeViewItemContext);
  if (context === undefined) {
    throw new Error(
      "useMediaNodeViewItemContext must be used within MediaNodeViewItemProvider"
    );
  }
  return context;
}
