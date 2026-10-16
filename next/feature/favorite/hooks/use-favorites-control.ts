import { addFavoriteAction } from "@/feature/favorite/actions/add";
import { addManyFavoritesAction } from "@/feature/favorite/actions/add-many";
import { removeFavoriteAction } from "@/feature/favorite/actions/remove";
import { removeManyFavoritesAction } from "@/feature/favorite/actions/remove-many";
import { revalidateFavoriteAction } from "@/feature/favorite/actions/revalidate";
import { revalidateManyFavoritesAction } from "@/feature/favorite/actions/revalidate-many";
import { useCallback, useEffect, useRef, useState } from "react";

type FavoriteMsg =
  | { type: "UPDATE"; id: string }
  | { type: "DELETE"; id: string }
  | { type: "UPDATE_MANY"; ids: string[] }
  | { type: "DELETE_MANY"; ids: string[] };

type Favorite = {
  id: string;
  favoritedAt: Date | null;
};

export interface UseFavoriteControlProps {
  favorites?: Favorite[];
}

export function useFavoritesControl({ favorites }: UseFavoriteControlProps) {
  const [favoriteSet, setFavoriteSet] = useState(() => {
    return favorites
      ? new Set(favorites.filter((f) => f.favoritedAt != null).map((f) => f.id))
      : new Set();
  });

  const { startFlight, finishFlight, isInFlight } = useInFlight();

  // タブ間同期
  const { broadcast } = useFavoriteChannel((msg: FavoriteMsg) => {
    setFavoriteSet((prev) => {
      const next = new Set(prev);

      switch (msg.type) {
        case "DELETE":
          next.delete(msg.id);
          break;
        case "UPDATE":
          next.add(msg.id);
          break;
        case "UPDATE_MANY":
          msg.ids.forEach((id) => next.add(id));
          break;
        case "DELETE_MANY":
          msg.ids.forEach((id) => next.delete(id));
          break;
      }

      return next;
    });
  });

  // 現在の状態を取得
  const getFavorite = useCallback(
    (id: string) => {
      return {
        isFavorite: favoriteSet.has(id),
      };
    },
    [favoriteSet]
  );

  // お気に入り状態を更新
  const updateFavorite = useCallback(
    async (id: string): ReturnType<typeof addFavoriteAction> => {
      if (isInFlight(id)) return { success: false, message: "処理中です" };

      startFlight(id);

      // 楽観的アップデート
      setFavoriteSet((prev) => new Set(prev).add(id));
      broadcast({ type: "UPDATE", id });

      // サーバー処理開始
      try {
        const result = await addFavoriteAction({ path: id, rating });
        if (!result.success) {
          // 失敗時のロールバック
          const revalidated = await revalidateFavoriteAction({ path: id });
          if (revalidated.success) {
            const { favorite } = revalidated;
            setFavoriteSet((prev) => {
              const next = new Set(prev);
              if (favorite) {
                next.add(id);
              } else {
                next.delete(id);
              }
              return next;
            });
          }
        }
        return result;
      } finally {
        finishFlight(id);
      }
    },
    [broadcast, finishFlight, isInFlight, startFlight]
  );

  // お気に入り状態を削除
  const deleteFavorite = useCallback(
    async (path: string): ReturnType<typeof removeFavoriteAction> => {
      if (isInFlight(path)) return { success: false, message: "処理中です" };
      startFlight(path);

      // 楽観的アップデート
      setRatingMap((m) => {
        const next = new Map(m);
        next.delete(path);
        return next;
      });
      broadcast({ type: "DELETE", path });

      // サーバー処理開始
      try {
        const result = await removeFavoriteAction({ path });
        if (!result.success) {
          // 失敗時のロールバック
          const revalidated = await revalidateFavoriteAction({ path });
          if (revalidated.success && revalidated.favorite) {
            const { favorite } = revalidated;
            setRatingMap((m) => new Map(m).set(path, favorite.rating));
          }
        }
        return result;
      } finally {
        finishFlight(path);
      }
    },
    [broadcast, finishFlight, isInFlight, startFlight]
  );

  // お気に入り状態をトグル
  const toggleFavorite = useCallback(
    (path: string) => {
      const { isFavorite } = getFavorite(path);
      return isFavorite ? deleteFavorite(path) : updateFavorite(path, null);
    },
    [getFavorite, deleteFavorite, updateFavorite]
  );

  // 一括お気に入り登録
  const updateMultipleFavorites = useCallback(
    async ({
      paths,
      newRating = null,
      skipIfAlreadyFavorite = false,
    }: {
      paths: string[];
      newRating?: number | null;
      skipIfAlreadyFavorite?: boolean;
    }): ReturnType<typeof addManyFavoritesAction> => {
      // 現在の「お気に入り状態」と比較して、処理が必要なものだけ抽出
      const validPaths = paths.filter((path) => {
        const current = getFavorite(path);

        // すでにお気に入りの場合
        if (current.isFavorite) {
          // スキップ指定がある、または既に同じレーティングなら除外
          if (skipIfAlreadyFavorite || current.rating === newRating) {
            return false;
          }
        }

        // 処理中のパスは除外
        return !isInFlight(path);
      });

      if (validPaths.length === 0)
        return { success: false, message: "処理するパスがありません" };

      // すべてのパスを Flight 状態にする
      startFlight(...validPaths);

      // 楽観的アップデート
      setRatingMap((prev) => {
        const next = new Map(prev);
        validPaths.forEach((path) => next.set(path, newRating));
        return next;
      });

      // タブ間同期 (メッセージ送信)
      broadcast({ type: "UPDATE_MANY", paths: validPaths, rating: newRating });

      // サーバー処理開始
      try {
        const result = await addManyFavoritesAction({
          paths: validPaths,
          rating: newRating,
        });

        if (!result.success) {
          // 失敗時のロールバック
          const revalidateResult = await revalidateManyFavoritesAction({
            paths: validPaths,
          });

          if (revalidateResult.success && revalidateResult.favorites) {
            setRatingMap((prev) => {
              const next = new Map(prev);

              // 失敗した対象パスを一度全部消すか、最新状態で上書き
              // サーバーから返ってきたもの＝DBにあるもの
              const freshData = new Map(
                revalidateResult.favorites.map((f) => [f.path, f.rating])
              );

              validPaths.forEach((path) => {
                if (freshData.has(path)) {
                  next.set(path, freshData.get(path)!);
                } else {
                  next.delete(path);
                }
              });
              return next;
            });
          }
        }

        return result;
      } finally {
        finishFlight(...validPaths);
      }
    },
    [broadcast, finishFlight, getFavorite, isInFlight, startFlight]
  );

  // 一括お気に入り解除
  const deleteMultipleFavorites = useCallback(
    async (paths: string[]): ReturnType<typeof removeManyFavoritesAction> => {
      // 現在の「お気に入り状態」と比較して、処理が必要なものだけ抽出
      const validPaths = paths.filter((path) => {
        const current = getFavorite(path);

        // お気に入りの場合は処理対象
        if (current.isFavorite) {
          return true;
        }

        // 処理中のパスは除外
        return !isInFlight(path);
      });

      if (validPaths.length === 0)
        return { success: false, message: "処理するパスがありません" };

      // すべてのパスを Flight 状態にする
      startFlight(...validPaths);

      // 楽観的アップデート
      setRatingMap((prev) => {
        const next = new Map(prev);
        validPaths.forEach((path) => next.delete(path));
        return next;
      });

      // タブ間同期
      broadcast({ type: "DELETE_MANY", paths: validPaths });

      // サーバー処理開始
      try {
        const result = await removeManyFavoritesAction({ paths: validPaths });

        if (!result.success) {
          // 失敗時のロールバック
          const revalidateResult = await revalidateManyFavoritesAction({
            paths: validPaths,
          });

          if (revalidateResult.success && revalidateResult.favorites) {
            setRatingMap((prev) => {
              const next = new Map(prev);

              // 失敗した対象パスを一度全部消すか、最新状態で上書き
              // サーバーから返ってきたもの＝DBにあるもの
              const freshData = new Map(
                revalidateResult.favorites.map((f) => [f.path, f.rating])
              );

              validPaths.forEach((path) => {
                if (freshData.has(path)) {
                  next.set(path, freshData.get(path)!);
                } else {
                  next.delete(path);
                }
              });
              return next;
            });
          }
        }

        return result;
      } finally {
        finishFlight(...validPaths);
      }
    },
    [broadcast, finishFlight, getFavorite, isInFlight, startFlight]
  );

  return {
    getFavorite,
    updateFavorite,
    updateMultipleFavorites,
    deleteFavorite,
    deleteMultipleFavorites,
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

  const startFlight = useCallback((...paths: string[]) => {
    setInFlight((prev) => {
      const next = new Set(prev);
      paths.forEach((p) => next.add(p));
      return next;
    });
  }, []);

  const finishFlight = useCallback((...paths: string[]) => {
    setInFlight((prev) => {
      const next = new Set(prev);
      paths.forEach((p) => next.delete(p));
      return next;
    });
  }, []);

  const isInFlight = useCallback(
    (path: string) => inFlight.has(path),
    [inFlight]
  );

  return { startFlight, finishFlight, isInFlight };
}
