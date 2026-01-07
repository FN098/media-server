"use client";

import { useViewer } from "@/hooks/use-viewer";
import { createContext, useContext } from "react";

type ViewerContextType = ReturnType<typeof useViewer>;

const ViewerContext = createContext<ViewerContextType | undefined>(undefined);

export function ViewerProvider({ children }: { children: React.ReactNode }) {
  const value = useViewer();

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
