"use client";

import {
  useMediaNodePagingView,
  UseMediaNodePagingViewProps,
} from "@/feature/view/hooks/use-media-node-paging-view";
import { createContext, useContext } from "react";

const MediaNodePagingViewContext = createContext<
  ReturnType<typeof useMediaNodePagingView> | undefined
>(undefined);

interface MediaNodePagingViewProvider extends UseMediaNodePagingViewProps {
  children: React.ReactNode;
}

export function MediaNodePagingViewProvider({
  children,
  ...props
}: MediaNodePagingViewProvider) {
  const value = useMediaNodePagingView(props);

  return (
    <MediaNodePagingViewContext.Provider value={value}>
      {children}
    </MediaNodePagingViewContext.Provider>
  );
}

export function useMediaNodePagingViewContext() {
  const context = useContext(MediaNodePagingViewContext);
  if (context === undefined) {
    throw new Error(
      "useMediaNodePagingViewContext must be used within MediaNodePagingViewProvider"
    );
  }
  return context;
}
