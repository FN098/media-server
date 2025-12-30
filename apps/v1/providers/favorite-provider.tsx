"use client";

import { revalidateFavorite, updateFavorite } from "@/actions/favorite-actions";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

// お気に入り状態管理
function useFavorites(initialFavorites?: Record<string, boolean>) {
  const [favorites, setFavorites] = useState<Map<string, boolean>>(
    () => new Map(Object.entries(initialFavorites ?? {}))
  );

  const setFavorite = useCallback((path: string, value: boolean) => {
    setFavorites((m) => {
      if (m.get(path) === value) return m; // 参照を変えないことで再レンダリング抑制
      return new Map(m).set(path, value);
    });
  }, []);

  const isFavorite = useCallback(
    (path: string): boolean => favorites.get(path) ?? false,
    [favorites]
  );

  return { favorites, setFavorite, isFavorite };
}

// 複数タブ同期（BroadcastChannel）
function useFavoriteChannel(onMessage: (path: string, value: boolean) => void) {
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    // クライアントサイドでのみ初期化
    const channel = new BroadcastChannel("favorite_sync");
    channelRef.current = channel;

    const handler = (e: MessageEvent) => {
      const { path, value } = e.data as { path: string; value: boolean };
      onMessage(path, value);
    };

    channel.addEventListener("message", handler);
    return () => {
      channel.removeEventListener("message", handler);
      channel.close();
    };
  }, [onMessage]);

  const broadcast = useCallback((path: string, value: boolean) => {
    channelRef.current?.postMessage({ path, value });
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
      setInFlight((s) => {
        const n = new Set(s);
        n.delete(path);
        return n;
      }),
    []
  );

  const isInFlight = useCallback(
    (path: string) => inFlight.has(path),
    [inFlight]
  );

  return { startFlight, finishFlight, isInFlight };
}

type FavoriteContextValue = {
  isFavorite(path: string): boolean;
  toggleFavorite(path: string): Promise<boolean | undefined>;
};

const FavoriteContext = createContext<FavoriteContextValue | null>(null);

type FavoriteProviderProps = {
  initialFavorites?: Record<string, boolean>;
  children: React.ReactNode;
};

export function FavoriteProvider({
  initialFavorites,
  children,
}: FavoriteProviderProps) {
  const { setFavorite, isFavorite } = useFavorites(initialFavorites);
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
        const { ok } = await updateFavorite(path);
        if (!ok) throw new Error("Failed to update");
        return current; // 成功時の状態を返す
      } catch (e) {
        // 3. 失敗時のロールバック（再同期）
        console.error("Favorite sync failed, revalidating...", e);
        const revalidated = await revalidateFavorite(path);
        const actual = revalidated.ok ? revalidated.value : prev;
        setFavorite(path, actual);
        broadcast(path, actual);
        return actual; // 最終的な状態を返す
      } finally {
        finishFlight(path);
      }
    },
    [broadcast, finishFlight, isFavorite, isInFlight, setFavorite, startFlight]
  );

  const value = useMemo(
    () => ({ isFavorite, toggleFavorite }),
    [isFavorite, toggleFavorite]
  );

  return (
    <FavoriteContext.Provider value={value}>
      {children}
    </FavoriteContext.Provider>
  );
}

export function useFavorite() {
  const ctx = useContext(FavoriteContext);
  if (!ctx) {
    throw new Error("useFavorite must be used within FavoriteProvider");
  }
  return ctx;
}
