import { useThumbEventContext } from "@/providers/thumb-event-provider";
import { ThumbCompletedEvent } from "@/workers/thumb/types";
import { useEffect } from "react";

export function useThumbEventObserver(
  handler: (e: ThumbCompletedEvent) => void
) {
  const { subscribe } = useThumbEventContext();

  useEffect(() => {
    return subscribe(handler);
  }, [subscribe, handler]);
}
