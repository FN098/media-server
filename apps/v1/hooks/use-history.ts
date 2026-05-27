"use client";

import { MediaNode } from "@/lib/media/types";
import { useState } from "react";

type HistoryItem = {
  path: string;
  type: "file" | "directory";
};

type Options = {
  maxLength?: number;
};

export function useHistory(options: Options) {
  const { maxLength = 10 } = options ?? {};

  const [history, setHistory] = useState<HistoryItem[]>([]);

  const push = (item: HistoryItem) => {
    setHistory((prev) => {
      const last = prev.at(-1);
      if (last?.path === item.path && last.type === item.type) {
        return prev; // 同じなら無視
      }
      return [...prev, item].slice(-maxLength);
    });
  };

  const replaceLast = (item: HistoryItem) => {
    setHistory((prev) => {
      if (prev.length === 0) return [item];
      const next = [...prev];
      next[next.length - 1] = item;
      return next.slice(-maxLength);
    });
  };

  const pop = () => {
    setHistory((prev) => prev.slice(0, -1));
  };

  const last = history.at(-1);

  return {
    history,
    set: setHistory,
    push,
    replaceLast,
    pop,
    last,
  };
}

export const toHistoryItem = (media: MediaNode): HistoryItem => ({
  path: media.path,
  type: media.isDirectory ? "directory" : "file",
});
