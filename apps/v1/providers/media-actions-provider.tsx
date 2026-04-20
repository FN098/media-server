"use client";

import { MediaActions, useMediaActions } from "@/hooks/use-media-actions";
import { createContext, ReactNode, useContext } from "react";

type MediaActionsContextType = ReturnType<typeof useMediaActions>;

const MediaActionsContext = createContext<MediaActionsContextType | undefined>(
  undefined
);

export function MediaActionsProvider({
  children,
  actions,
}: {
  children: ReactNode;
  actions: MediaActions;
}) {
  const value = useMediaActions(actions);

  return (
    <MediaActionsContext.Provider value={value}>
      {children}
    </MediaActionsContext.Provider>
  );
}

export function useMediaActionsContext() {
  const context = useContext(MediaActionsContext);
  if (context === undefined) {
    throw new Error(
      "useMediaActionContext must be used within MediaActionsProvider"
    );
  }
  return context;
}
