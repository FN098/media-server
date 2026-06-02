"use client";

import { useThumbEvent } from "@/hooks/thumbs/use-thumb-event";
import { createContext, useContext } from "react";

type ThumbEvent = ReturnType<typeof useThumbEvent>;

const ThumbEventContext = createContext<ThumbEvent | undefined>(undefined);

export function ThumbEventProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const value = useThumbEvent();

  return (
    <ThumbEventContext.Provider value={value}>
      {children}
    </ThumbEventContext.Provider>
  );
}

export function useThumbEventContext() {
  const context = useContext(ThumbEventContext);
  if (context === undefined) {
    throw new Error(
      "useThumbEventContext must be used within ThumbEventProvider"
    );
  }
  return context;
}
