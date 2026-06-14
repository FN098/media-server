"use client";

import {
  useMediaViewer,
  UseMediaViewerProps,
} from "@/hooks/viewer/use-media-viewer";
import { createContext, useContext } from "react";

const MediaViewerContext = createContext<
  ReturnType<typeof useMediaViewer> | undefined
>(undefined);

interface MediaViewerProviderProps extends UseMediaViewerProps {
  children: React.ReactNode;
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
