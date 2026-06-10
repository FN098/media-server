import { MediaNode } from "@/lib/media/types";
import { useState } from "react";

type HistoryItem = {
  path: string;
  type: "file" | "directory";
};

export interface UseHistoryProps {
  maxLength?: number;
}

export function useHistory({ maxLength = 10 }: UseHistoryProps = {}) {
  const [items, setItems] = useState<HistoryItem[]>([]);

  const push = (item: HistoryItem) => {
    setItems((prev) => {
      const last = prev.at(-1);
      if (last?.path === item.path && last.type === item.type) {
        return prev; // 同じなら無視
      }
      return [...prev, item].slice(-maxLength);
    });
  };

  const replaceLast = (item: HistoryItem) => {
    setItems((prev) => {
      if (prev.length === 0) return [item];
      const next = [...prev];
      next[next.length - 1] = item;
      return next.slice(-maxLength);
    });
  };

  const pop = () => {
    setItems((prev) => prev.slice(0, -1));
  };

  const last = items.at(-1);

  return {
    items,
    set: setItems,
    push,
    replaceLast,
    pop,
    last,
  };
}

export type History = ReturnType<typeof useHistory>;

export const toHistoryItem = (media: MediaNode): HistoryItem => ({
  path: media.path,
  type: media.isDirectory ? "directory" : "file",
});
