import { deleteFavoriteAction } from "@/actions/favorite/delete";
import { deleteManyFavoritesAction } from "@/actions/favorite/delete-many";
import { revalidateFavoriteAction } from "@/actions/favorite/revalidate";
import { revalidateMultipleFavoritesAction } from "@/actions/favorite/revalidate-multiple";
import { updateFavoriteAction } from "@/actions/favorite/update";
import { updateMultipleFavoritesAction } from "@/actions/favorite/update-multiple";
import { Favorite } from "@/lib/favorite/types";
import { useCallback, useEffect, useRef, useState } from "react";

type FavoriteMsg =
  | { type: "UPDATE"; path: string; rating: number | null }
  | { type: "DELETE"; path: string }
  | { type: "UPDATE_MANY"; paths: string[]; rating: number | null }
  | { type: "DELETE_MANY"; paths: string[] };

export interface UseFavoriteControlProps {
  favorites?: Favorite[];
}

export function useFavoritesControl({ favorites }: UseFavoriteControlProps) {
  const [ratingMap, setRatingMap] = useState(() => {
    return new Map(
      favorites
        ?.filter((f) => !!f.favoritedAt)
        .map((f) => [f.path, f.rating]) ?? []
    );
  });

  const { startFlight, finishFlight, isInFlight } = useInFlight();

  // タブ間同期
  const { broadcast } = useFavoriteChannel((msg: FavoriteMsg) => {
    setRatingMap((prev) => {
      const next = new Map(prev);

      switch (msg.type) {
        case "DELETE":
          next.delete(msg.path);
          break;
        case "UPDATE":
          next.set(msg.path, msg.rating);
          break;
        case "UPDATE_MANY":
          msg.paths.forEach((path) => next.set(path, msg.rating));
          break;
        case "DELETE_MANY":
          msg.paths.forEach((path) => next.delete(path));
          break;
      }

      return next;
    });
  });

  // 現在の状態を取得
  const getFavorite = useCallback(
    (path: string) => {
      return {
        isFavorite: ratingMap.has(path),
        rating: ratingMap.get(path) ?? null,
      };
    },
    [ratingMap]
  );

  // お気に入り状態を更新
  const updateFavorite = useCallback(
    async (
      path: string,
      rating: number | null
    ): ReturnType<typeof updateFavoriteAction> => {
      if (isInFlight(path)) return { success: false, message: "処理中です" };
      startFlight(path);

      // 楽観的アップデート
      setRatingMap((m) => new Map(m).set(path, rating));
      broadcast({ type: "UPDATE", path, rating });

      // サーバー処理開始
      try {
        const result = await updateFavoriteAction(path, rating);
        if (!result.success) {
          // 失敗時のロールバック
          const revalidated = await revalidateFavoriteAction(path);
          if (revalidated.success) {
            const { favorite } = revalidated;
            setRatingMap((m) => {
              const next = new Map(m);
              if (favorite) {
                next.set(path, favorite.rating);
              } else {
                next.delete(path);
              }
              return next;
            });
          }
        }
        return result;
      } finally {
        finishFlight(path);
      }
    },
    [broadcast, finishFlight, isInFlight, startFlight]
  );

  // お気に入り状態を削除
  const deleteFavorite = useCallback(
    async (path: string): ReturnType<typeof deleteFavoriteAction> => {
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
        const result = await deleteFavoriteAction(path);
        if (!result.success) {
          // 失敗時のロールバック
          const revalidated = await revalidateFavoriteAction(path);
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
    }): ReturnType<typeof updateMultipleFavoritesAction> => {
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
        const result = await updateMultipleFavoritesAction(
          validPaths,
          newRating
        );

        if (!result.success) {
          // 失敗時のロールバック
          const revalidateResult =
            await revalidateMultipleFavoritesAction(validPaths);

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
    async (paths: string[]): ReturnType<typeof deleteManyFavoritesAction> => {
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
        const result = await deleteManyFavoritesAction({ paths: validPaths });

        if (!result.success) {
          // 失敗時のロールバック
          const revalidateResult =
            await revalidateMultipleFavoritesAction(validPaths);

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
