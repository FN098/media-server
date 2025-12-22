"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type FavoriteContextValue = {
  isFavorite(path: string): boolean;
  toggleFavorite(path: string): Promise<void>;
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
  const [favorites, setFavorites] = useState<Map<string, boolean>>(
    () => new Map(Object.entries(initialFavorites ?? {}))
  );
  const [inFlight, setInFlight] = useState<Set<string>>(() => new Set());
  const channel = useMemo(() => new BroadcastChannel("favorite"), []);

  const isFavorite = useCallback(
    (path: string) => favorites.get(path) ?? false,
    [favorites]
  );

  async function revalidate(path: string) {
    const res = await fetch(`/api/favorite?path=${encodeURIComponent(path)}`);
    const { isFavorite } = (await res.json()) as { isFavorite: boolean };
    setFavorites((m) => new Map(m).set(path, isFavorite));
  }

  const toggleFavorite = useCallback(
    async (path: string) => {
      if (inFlight.has(path)) return;

      const prev = isFavorite(path);

      setInFlight((s) => new Set(s).add(path));
      setFavorites((m) => new Map(m).set(path, !prev));

      channel.postMessage({ path, value: !prev });

      try {
        await fetch("/api/favorite", {
          method: prev ? "DELETE" : "POST",
          body: JSON.stringify({ path }),
        });
      } catch (e) {
        await revalidate(path);
        throw e;
      } finally {
        setInFlight((s) => {
          const n = new Set(s);
          n.delete(path);
          return n;
        });
      }
    },
    [channel, inFlight, isFavorite]
  );

  useEffect(() => {
    channel.onmessage = (e) => {
      const { path, value } = e.data as { path: string; value: boolean };
      setFavorites((m) => new Map(m).set(path, value));
    };
    return () => channel.close();
  }, [channel]);

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
