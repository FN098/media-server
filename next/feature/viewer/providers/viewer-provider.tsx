"use client";

import { useViewer, UseViewerProps } from "@/feature/viewer/hooks/use-viewer";
import { createContext, useContext } from "react";

const ViewerContext = createContext<ReturnType<typeof useViewer> | undefined>(
  undefined
);

interface ViewerProviderProps extends UseViewerProps {
  children: React.ReactNode;
}

export function ViewerProvider({ children, ...rest }: ViewerProviderProps) {
  const value = useViewer(rest);

  return (
    <ViewerContext.Provider value={value}>{children}</ViewerContext.Provider>
  );
}

export function useViewerContext() {
  const context = useContext(ViewerContext);
  if (context === undefined) {
    throw new Error("useViewerContext must be used within ViewerProvider");
  }
  return context;
}
