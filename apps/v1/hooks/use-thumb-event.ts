"use client";

import { getThumbEventsUrl } from "@/lib/path/helpers";
import { ThumbCompletedEvent } from "@/workers/thumb/types";
import { useCallback, useEffect, useRef } from "react";

type Listener = (e: ThumbCompletedEvent) => void;

export function useThumbEvent() {
  const listeners = useRef(new Set<Listener>());

  useEffect(() => {
    const eventSource = new EventSource(getThumbEventsUrl());

    eventSource.onmessage = (e: MessageEvent<string>) => {
      const event = JSON.parse(e.data) as ThumbCompletedEvent;
      listeners.current.forEach((l) => l(event));
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const subscribe = useCallback((listener: Listener) => {
    listeners.current.add(listener);
    return () => {
      listeners.current.delete(listener);
    };
  }, []);

  return { subscribe };
}
