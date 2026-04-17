"use client";

import {
  deleteFavoriteAction,
  revalidateFavoriteAction,
  updateFavoriteAction,
} from "@/actions/favorite-actions";
import { FavoritesMap, FavoriteValue } from "@/lib/favorite/types";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

type FavoriteMsg =
  | { type: "UPDATE"; path: string; rating: number | null }
  | { type: "DELETE"; path: string };

export function useFavorites(initialData?: FavoriteValue[]) {
  const [favorites, setFavorites] = useState<FavoritesMap>(
    () =>
      new Map(
        initialData
          ?.filter((f) => !!f.favoritedAt)
          .map((f) => [f.path, f.rating]) ?? []
      )
  );

  const { startFlight, finishFlight, isInFlight } = useInFlight();
  const [isUpdating, startUpdating] = useTransition();
  const [isDeleting, startDeleting] = useTransition();
  const isLoading = isUpdating || isDeleting;

  // タブ間同期
  const { broadcast } = useFavoriteChannel((msg: FavoriteMsg) => {
    setFavorites((prev) => {
      const next = new Map(prev);
      if (msg.type === "DELETE") {
        next.delete(msg.path);
      } else {
        next.set(msg.path, msg.rating);
      }
      return next;
    });
  });

  // 現在の状態を取得
  const getFavorite = useCallback(
    (path: string) => {
      return {
        isFavorite: favorites.has(path),
        rating: favorites.get(path) ?? null,
      };
    },
    [favorites]
  );

  // お気に入り状態を更新
  const updateFavorite = useCallback(
    (path: string, rating: number | null) => {
      if (isInFlight(path)) return;
      startFlight(path);

      // 楽観的アップデート
      setFavorites((m) => new Map(m).set(path, rating));
      broadcast({ type: "UPDATE", path, rating });

      startUpdating(async () => {
        try {
          const { success } = await updateFavoriteAction(path, rating);
          if (!success) throw new Error();
        } catch {
          // 失敗時のロールバック
          const { favorite } = await revalidateFavoriteAction(path);
          setFavorites((m) => {
            const next = new Map(m);
            if (favorite) {
              next.set(path, favorite.rating);
            } else {
              next.delete(path);
            }
            return next;
          });
        } finally {
          finishFlight(path);
        }
      });
    },
    [broadcast, finishFlight, isInFlight, startFlight]
  );

  const deleteFavorite = useCallback(
    (path: string) => {
      if (isInFlight(path)) return;
      startFlight(path);

      // 楽観的アップデート
      setFavorites((m) => {
        const next = new Map(m);
        next.delete(path);
        return next;
      });
      broadcast({ type: "DELETE", path });

      startDeleting(async () => {
        try {
          const { success } = await deleteFavoriteAction(path);
          if (!success) throw new Error();
        } catch {
          // 失敗時のロールバック
          const { favorite } = await revalidateFavoriteAction(path);
          if (favorite)
            setFavorites((m) => new Map(m).set(path, favorite.rating));
        } finally {
          finishFlight(path);
        }
      });
    },
    [broadcast, finishFlight, isInFlight, startFlight]
  );

  const toggleFavorite = useCallback(
    (path: string) => {
      const { isFavorite } = getFavorite(path);
      return isFavorite ? deleteFavorite(path) : updateFavorite(path, null);
    },
    [getFavorite, deleteFavorite, updateFavorite]
  );

  return {
    favorites,
    getFavorite,
    isUpdating,
    updateFavorite,
    isDeleting,
    deleteFavorite,
    isLoading,
    toggleFavorite,
  };
}

// 複数タブ同期（BroadcastChannel）
function useFavoriteChannel(onMessage: (msg: FavoriteMsg) => void) {
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    // クライアントサイドでのみ初期化
    const channel = new BroadcastChannel("favorite_sync");
    channelRef.current = channel;
    channel.onmessage = (e: MessageEvent<FavoriteMsg>) => onMessage(e.data);
    return () => channel.close();
  }, [onMessage]);

  const broadcast = useCallback((msg: FavoriteMsg) => {
    channelRef.current?.postMessage(msg);
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
