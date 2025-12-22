"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type FavoriteContextValue = {
  isFavorite(path: string): boolean;
  toggleFavorite(path: string): Promise<void>;
};

const FavoriteContext = createContext<FavoriteContextValue | null>(null);

// お気に入り状態管理
function useFavorites(initialFavorites?: Record<string, boolean>) {
  const [favorites, setFavorites] = useState<Map<string, boolean>>(
    () => new Map(Object.entries(initialFavorites ?? {}))
  );

  const setFavorite = (path: string, value: boolean) =>
    setFavorites((m) => new Map(m).set(path, value));

  const isFavorite = useCallback(
    (path: string) => favorites.get(path) ?? false,
    [favorites]
  );

  return { favorites, setFavorite, isFavorite };
}

// 複数タブ同期（BroadcastChannel）
function useFavoriteChannel(onMessage: (path: string, value: boolean) => void) {
  const channelRef = useRef<BroadcastChannel | null>(null);

  if (channelRef.current === null) {
    channelRef.current = new BroadcastChannel("favorite");
  }

  useEffect(() => {
    const channel = channelRef.current!;
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

  const startFlight = (path: string) =>
    setInFlight((s) => new Set(s).add(path));

  const finishFlight = (path: string) =>
    setInFlight((s) => {
      const n = new Set(s);
      n.delete(path);
      return n;
    });

  const isInFlight = (path: string) => inFlight.has(path);

  return { startFlight, finishFlight, isInFlight };
}

// API失敗時の再同期（revalidate）
async function revalidate(path: string): Promise<boolean> {
  const res = await fetch(`/api/favorite?path=${encodeURIComponent(path)}`);
  const { isFavorite } = (await res.json()) as { isFavorite: boolean };
  return isFavorite;
}

// お気に入り更新
async function update(path: string, value: boolean) {
  const res = await fetch("/api/favorite", {
    method: value === false ? "DELETE" : "POST",
    body: JSON.stringify({ path }),
  });
  return res.ok;
}

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
  const { broadcast } = useFavoriteChannel((path, value) => {
    setFavorite(path, value);
  });

  const toggleFavorite = useCallback(
    async (path: string) => {
      if (isInFlight(path)) return;

      const prev = isFavorite(path);
      const current = !prev;

      startFlight(path);
      setFavorite(path, current);
      broadcast(path, current);

      try {
        await update(path, current);
      } catch (e) {
        const actual = await revalidate(path);
        setFavorite(path, actual);
        throw e;
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
