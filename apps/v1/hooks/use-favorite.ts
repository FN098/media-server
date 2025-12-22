"use client";

import { MediaNode } from "@/lib/media/types";
import { useCallback, useState } from "react";

export function useFavorite(initialNodes?: MediaNode[]) {
  const [favorites, setFavorites] = useState<Map<string, boolean>>(
    () => new Map(initialNodes?.map((n) => [n.path, n.isFavorite]) ?? [])
  );

  const isFavorite = useCallback(
    (node: MediaNode) => favorites.get(node.path) ?? node.isFavorite,
    [favorites]
  );

  const toggleFavorite = useCallback(
    async (node: MediaNode) => {
      const prev = isFavorite(node);

      // optimistic update
      setFavorites((m) => new Map(m).set(node.path, !prev));

      try {
        await fetch("/api/favorite", {
          method: prev ? "DELETE" : "POST",
          body: JSON.stringify({ path: node.path }),
        });
      } catch (e) {
        // rollback
        setFavorites((m) => new Map(m).set(node.path, prev));
        throw e;
      }
    },
    [isFavorite]
  );

  return { isFavorite, toggleFavorite };
}
