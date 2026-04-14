"use client";

import { useViewerUI } from "@/hooks/use-viewer-ui";
import { createContext, useContext } from "react";

type ViewerUIContextType = ReturnType<typeof useViewerUI>;

const ViewerUIContext = createContext<ViewerUIContextType | undefined>(
  undefined
);

export function ViewerUIProvider({ children }: { children: React.ReactNode }) {
  const value = useViewerUI();

  return (
    <ViewerUIContext.Provider value={value}>
      {children}
    </ViewerUIContext.Provider>
  );
}

export function useViewerUIContext() {
  const context = useContext(ViewerUIContext);
  if (context === undefined) {
    throw new Error("useViewerUIContext must be used within ViewerUIProvider");
  }
  return context;
}
