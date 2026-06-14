"use client";

import { useSlideshow } from "@/feature/viewer/hooks/use-slideshow";
import React, { createContext, useContext } from "react";

const SlideshowContext = createContext<
  ReturnType<typeof useSlideshow> | undefined
>(undefined);

export function SlideshowProvider({ children }: { children: React.ReactNode }) {
  const value = useSlideshow();

  return (
    <SlideshowContext.Provider value={value}>
      {children}
    </SlideshowContext.Provider>
  );
}

export function useSlideshowContext() {
  const context = useContext(SlideshowContext);
  if (context === undefined) {
    throw new Error(
      "useSlideshowContext must be used within SlideshowProvider"
    );
  }
  return context;
}
