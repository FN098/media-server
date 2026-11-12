import { useThumbEventContext } from "@/feature/_old/thumbnail/providers/thumb-event-provider";
import { ThumbJobCompletedEvent } from "@/feature/thumbnail/lib/types";
import { useEffect } from "react";

export function useThumbEventObserver(
  handler: (e: ThumbJobCompletedEvent) => void
) {
  const { subscribe } = useThumbEventContext();

  useEffect(() => {
    return subscribe(handler);
  }, [subscribe, handler]);
}
