"use client";

import {
  useMediaNodeDnd,
  UseMediaNodeDndProps,
} from "@/hooks/dnd/use-media-node-dnd";
import { DndContext } from "@dnd-kit/core";
import { createContext, useContext } from "react";

const MediaNodeDndContext = createContext<
  ReturnType<typeof useMediaNodeDnd> | undefined
>(undefined);

interface MediaNodeDndProviderProps extends UseMediaNodeDndProps {
  children: React.ReactNode;
}

export function MediaNodeDndProvider({
  children,
  ...props
}: MediaNodeDndProviderProps) {
  const value = useMediaNodeDnd(props);
  const { sensors, handleDragStart, handleDragEnd } = value;

  return (
    <MediaNodeDndContext.Provider value={value}>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {children}
      </DndContext>
    </MediaNodeDndContext.Provider>
  );
}

export function useMediaNodeDndContext() {
  const context = useContext(MediaNodeDndContext);
  if (context === undefined) {
    throw new Error(
      "useMediaNodeDndContext must be used within MediaNodeDndProvider"
    );
  }
  return context;
}
