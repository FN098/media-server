import { ThumbJobCompletedEvent } from "@/lib/thumb-job/types";
import { useThumbEventContext } from "@/providers/thumb-event-provider";
import { useEffect } from "react";

export function useThumbEventObserver(
  handler: (e: ThumbJobCompletedEvent) => void
) {
  const { subscribe } = useThumbEventContext();

  useEffect(() => {
    return subscribe(handler);
  }, [subscribe, handler]);
}
