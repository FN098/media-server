"use client";

import { ViewMode } from "@/lib/views/types";
import { createContext, useContext, useState } from "react";

type ViewModeContextValue = {
  view: ViewMode;
  setView: (v: ViewMode) => void;
};

const ViewModeContext = createContext<ViewModeContextValue | null>(null);

export function ViewModeProvider({ children }: { children: React.ReactNode }) {
  const [view, setView] = useState<ViewMode>("grid");

  return (
    <ViewModeContext.Provider value={{ view, setView }}>
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  const ctx = useContext(ViewModeContext);
  if (!ctx) throw new Error("useViewMode must be used within ViewModeProvider");
  return ctx;
}

export function useViewModeOptional() {
  const ctx = useContext(ViewModeContext);
  return ctx;
}
