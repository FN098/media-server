"use client";

import { getThumbEventsUrl } from "@/lib/path/helpers";
import { ThumbCompletedEvent } from "@/workers/thumb/types";
import { createContext, useContext, useEffect, useRef } from "react";

// TODO: リファクタリング

type Listener = (e: ThumbCompletedEvent) => void;

const ThumbEventContext = createContext<{
  subscribe: (listener: Listener) => () => void;
} | null>(null);

export function ThumbEventProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const listeners = useRef(new Set<Listener>());

  useEffect(() => {
    const eventSource = new EventSource(getThumbEventsUrl());

    eventSource.onmessage = (e: MessageEvent<string>) => {
      const event = JSON.parse(e.data) as ThumbCompletedEvent;
      listeners.current.forEach((l) => l(event));
    };

    return () => eventSource.close();
  }, []);

  return (
    <ThumbEventContext.Provider
      value={{
        subscribe(listener) {
          listeners.current.add(listener);
          return () => listeners.current.delete(listener);
        },
      }}
    >
      {children}
    </ThumbEventContext.Provider>
  );
}

export function useThumbEventObserver(
  handler: (e: ThumbCompletedEvent) => void
) {
  const ctx = useContext(ThumbEventContext);
  useEffect(() => ctx?.subscribe(handler), [ctx, handler]);
}
