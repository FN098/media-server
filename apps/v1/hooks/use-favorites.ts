import { revalidateFavorite, updateFavorite } from "@/actions/favorite-actions";
import {
  FavoritesMap,
  FavoritesRecord,
  IsFavoriteType,
  PathType,
  PathTypeSet,
} from "@/lib/favorite/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export function useFavorites(initialFavorites?: FavoritesRecord) {
  const [favorites, setFavorites] = useState<FavoritesMap>(
    // 再レンダリングによる Map の再インスタンス化を防ぐためラムダ式を使う
    () => new Map(Object.entries(initialFavorites ?? {}))
  );

  const setFavorite = useCallback((path: PathType, value: IsFavoriteType) => {
    setFavorites((m) => {
      if (m.get(path) === value) return m; // 参照を変えないことで再レンダリング抑制
      return new Map(m).set(path, value);
    });
  }, []);

  const isFavorite: (path: PathType) => IsFavoriteType = useCallback(
    (path) => favorites.get(path) ?? false,
    [favorites]
  );

  const { startFlight, finishFlight, isInFlight } = useInFlight();
  const { broadcast } = useFavoriteChannel(setFavorite);

  const toggleFavorite = useCallback(
    async (path: string): Promise<boolean | undefined> => {
      if (isInFlight(path)) return;

      const prev = isFavorite(path);
      const current = !prev;

      // 1. 楽観的アップデート
      startFlight(path);
      setFavorite(path, current);
      broadcast(path, current);

      try {
        // 2. サーバー更新
        const { success } = await updateFavorite(path);
        if (success) {
          return current; // 成功時の状態を返す
        }

        // 3. 失敗時のロールバック（再同期）
        const revalidated = await revalidateFavorite(path);
        if (revalidated.success) {
          const actual = revalidated.favorite!;
          setFavorite(path, actual);
          broadcast(path, actual);
          return actual; // 最終的な状態を返す
        }
      } finally {
        finishFlight(path);
      }
    },
    [broadcast, finishFlight, isFavorite, isInFlight, setFavorite, startFlight]
  );

  return useMemo(
    () => ({
      favorites,
      isFavorite,
      setFavorite,
      toggleFavorite,
    }),
    [favorites, isFavorite, setFavorite, toggleFavorite]
  );
}

// 複数タブ同期（BroadcastChannel）
function useFavoriteChannel(
  onMessage: (path: PathType, value: IsFavoriteType) => void
) {
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    // クライアントサイドでのみ初期化
    const channel = new BroadcastChannel("favorite_sync");
    channelRef.current = channel;

    const handler = (e: MessageEvent) => {
      const { path, value } = e.data as {
        path: PathType;
        value: IsFavoriteType;
      };
      onMessage(path, value);
    };

    channel.addEventListener("message", handler);
    return () => {
      channel.removeEventListener("message", handler);
      channel.close();
    };
  }, [onMessage]);

  const broadcast = useCallback((path: PathType, value: IsFavoriteType) => {
    channelRef.current?.postMessage({ path, value });
  }, []);

  return { broadcast };
}

// 同時連打防止（in-flight 管理）
function useInFlight() {
  // 再レンダリングによる Set の再インスタンス化を防ぐためラムダ式を使う
  const [inFlight, setInFlight] = useState<PathTypeSet>(() => new Set());

  const startFlight = useCallback(
    (path: PathType) => setInFlight((s) => new Set(s).add(path)),
    []
  );

  const finishFlight = useCallback(
    (path: PathType) =>
      setInFlight((prev) => {
        const next = new Set(prev);
        next.delete(path);
        return next;
      }),
    []
  );

  const isInFlight = useCallback(
    (path: PathType) => inFlight.has(path),
    [inFlight]
  );

  return { startFlight, finishFlight, isInFlight };
}
