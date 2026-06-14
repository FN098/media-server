import { useThumbEventContext } from "@/feature/thumbnail/providers/thumb-event-provider";
import { ThumbJobCompletedEvent } from "@/lib/thumb-job/types";
import { useEffect } from "react";

export function useThumbEventObserver(
  handler: (e: ThumbJobCompletedEvent) => void
) {
  const { subscribe } = useThumbEventContext();

  useEffect(() => {
    return subscribe(handler);
  }, [subscribe, handler]);
}
