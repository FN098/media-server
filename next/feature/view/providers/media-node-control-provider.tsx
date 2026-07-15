"use client";

import {
  UseMediaNodeControlProps,
  useMediaNodeControl,
} from "@/feature/view/hooks/use-media-node-control";
import { createContext, useContext } from "react";

const MediaNodeControlContext = createContext<
  ReturnType<typeof useMediaNodeControl> | undefined
>(undefined);

interface MediaNodeControlProvider extends UseMediaNodeControlProps {
  children: React.ReactNode;
}

export function MediaNodeControlProvider({
  children,
  ...props
}: MediaNodeControlProvider) {
  const value = useMediaNodeControl(props);

  return (
    <MediaNodeControlContext.Provider value={value}>
      {children}
    </MediaNodeControlContext.Provider>
  );
}

export function useMediaNodeControlContext() {
  const context = useContext(MediaNodeControlContext);
  if (context === undefined) {
    throw new Error(
      "useMediaNodeControlContext must be used within MediaNodeControlProvider"
    );
  }
  return context;
}
