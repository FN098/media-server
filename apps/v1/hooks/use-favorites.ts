"use client";

import {
  revalidateFavoriteAction,
  updateFavoriteAction,
} from "@/actions/favorite-actions";
import { FavoritesMap, FavoriteStatus } from "@/lib/favorite/types";
import { useCallback, useEffect, useRef, useState } from "react";

type Msg = { path: string; rating: number | null };

export function useFavorites(initialData?: FavoriteStatus[]) {
  const [favorites, setFavorites] = useState<FavoritesMap>(
    () => new Map(initialData?.map((f) => [f.path, f.rating]) ?? [])
  );

  const { startFlight, finishFlight, isInFlight } = useInFlight();
  const { broadcast } = useFavoriteChannel((path, rating) => {
    setFavorites((m) => new Map(m).set(path, rating));
  });

  // 現在の状態を取得
  const getFavorite = useCallback(
    (path: string) => ({ rating: favorites.get(path) ?? null }),
    [favorites]
  );

  // お気に入り状態を更新
  const updateFavorite = useCallback(
    async (path: string, rating: number | null) => {
      if (isInFlight(path)) return;

      // 1. 楽観的アップデート
      startFlight(path);
      setFavorites((m) => new Map(m).set(path, rating));
      broadcast(path, rating);

      try {
        // 2. サーバー更新 (rating: null なら削除、数値ならupsert)
        const { success } = await updateFavoriteAction(path, rating);

        if (!success) {
          // 3. 失敗時のロールバック
          const { favorite } = await revalidateFavoriteAction(path);
          const actual = favorite?.rating ?? null;
          setFavorites((m) => new Map(m).set(path, actual));
          broadcast(path, actual);
        }
      } finally {
        finishFlight(path);
      }
    },
    [broadcast, finishFlight, isInFlight, startFlight]
  );

  // トグル動作 (デフォルト値を 3 とする)
  const toggleFavorite = useCallback(
    (path: string) => {
      const { rating } = getFavorite(path);
      return updateFavorite(path, rating ?? 3);
    },
    [updateFavorite, getFavorite]
  );

  return {
    favorites,
    getFavorite,
    updateFavorite,
    toggleFavorite,
  };
}

// 複数タブ同期（BroadcastChannel）
function useFavoriteChannel(
  onMessage: (path: string, rating: number | null) => void
) {
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    // クライアントサイドでのみ初期化
    const channel = new BroadcastChannel("favorite_sync");
    channelRef.current = channel;
    channel.onmessage = (e: MessageEvent<Msg>) =>
      onMessage(e.data.path, e.data.rating);
    return () => channel.close();
  }, [onMessage]);

  const broadcast = useCallback((path: string, rating: number | null) => {
    channelRef.current?.postMessage({ path, rating });
  }, []);

  return { broadcast };
}

// 同時連打防止（in-flight 管理）
function useInFlight() {
  const [inFlight, setInFlight] = useState<Set<string>>(() => new Set());
  const startFlight = useCallback(
    (path: string) => setInFlight((s) => new Set(s).add(path)),
    []
  );
  const finishFlight = useCallback(
    (path: string) =>
      setInFlight((prev) => {
        const next = new Set(prev);
        next.delete(path);
        return next;
      }),
    []
  );
  const isInFlight = useCallback(
    (path: string) => inFlight.has(path),
    [inFlight]
  );
  return { startFlight, finishFlight, isInFlight };
}
