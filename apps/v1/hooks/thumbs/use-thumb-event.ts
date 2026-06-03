import { getApiThumbEventsPath } from "@/lib/path/helpers";
import { ThumbJobCompletedEvent } from "@/lib/thumb-job/types";
import { useCallback, useEffect, useRef } from "react";

type Listener = (e: ThumbJobCompletedEvent) => void;

export function useThumbEvent() {
  const listeners = useRef(new Set<Listener>());

  useEffect(() => {
    const eventSource = new EventSource(getApiThumbEventsPath());

    eventSource.onmessage = (e: MessageEvent<string>) => {
      const event = JSON.parse(e.data) as ThumbJobCompletedEvent;
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
