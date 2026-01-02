"use client";

import { useViewMode } from "@/hooks/use-view-mode";
import { ViewMode } from "@/lib/query/types";
import { createContext, useContext } from "react";

type ViewModeContextType = ReturnType<typeof useViewMode>;

const ViewModeContext = createContext<ViewModeContextType | undefined>(
  undefined
);

export function ViewModeProvider({
  children,
  mode,
}: {
  children: React.ReactNode;
  mode?: ViewMode;
}) {
  const value = useViewMode(mode);

  return (
    <ViewModeContext.Provider value={value}>
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewModeContext() {
  const context = useContext(ViewModeContext);
  if (context === undefined) {
    throw new Error("useViewModeContext must be used within ViewModeProvider");
  }
  return context;
}
