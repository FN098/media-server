import { addFavoriteAction } from "@/__feature/favorite/actions/add";
import { addManyFavoritesAction } from "@/__feature/favorite/actions/add-many";
import { removeFavoriteAction } from "@/__feature/favorite/actions/remove";
import { removeManyFavoritesAction } from "@/__feature/favorite/actions/remove-many";
import { revalidateFavoriteAction } from "@/__feature/favorite/actions/revalidate";
import { revalidateManyFavoritesAction } from "@/__feature/favorite/actions/revalidate-many";
import { useCallback, useEffect, useRef, useState } from "react";

type FavoriteMsg =
  | { type: "ADD"; id: string }
  | { type: "REMOVE"; id: string }
  | { type: "ADD_MANY"; ids: string[] }
  | { type: "REMOVE_MANY"; ids: string[] };

type Entry = {
  id: string;
  isFavorite: boolean;
};

export interface UseFavoriteControlProps {
  entries?: Entry[];
}

export function useFavoritesControl({ entries }: UseFavoriteControlProps) {
  const [favoritedIds, setFavoritedIds] = useState(() => {
    return entries
      ? new Set(entries.filter((e) => e.isFavorite).map((f) => f.id))
      : new Set();
  });

  const { startFlight, finishFlight, isInFlight } = useInFlight();

  // タブ間同期
  const { broadcast } = useFavoriteChannel((msg: FavoriteMsg) => {
    setFavoritedIds((prev) => {
      const next = new Set(prev);

      switch (msg.type) {
        case "ADD":
          next.add(msg.id);
          break;
        case "REMOVE":
          next.delete(msg.id);
          break;
        case "ADD_MANY":
          msg.ids.forEach((id) => next.add(id));
          break;
        case "REMOVE_MANY":
          msg.ids.forEach((id) => next.delete(id));
          break;
      }

      return next;
    });
  });

  // お気に入り取得
  const getFavorite = useCallback(
    (id: string) => {
      return {
        isFavorite: favoritedIds.has(id),
      };
    },
    [favoritedIds]
  );

  // お気に入り検証
  const revalidateFavorite = useCallback(
    async (id: string, isDirectory: boolean) => {
      if (isInFlight(id)) return { success: false, message: "処理中です" };

      startFlight(id);

      // サーバー処理開始
      try {
        const revalidated = await revalidateFavoriteAction({
          id,
          isDirectory,
        });
        if (revalidated.success) {
          const { isFavorite } = revalidated;
          setFavoritedIds((prev) => {
            const next = new Set(prev);
            if (isFavorite) {
              next.add(id);
            } else {
              next.delete(id);
            }
            return next;
          });
        }
      } finally {
        finishFlight(id);
      }
    },
    []
  );

  // お気に入り追加
  const addFavorite = useCallback(
    async (id: string, isDirectory: boolean) => {
      if (isInFlight(id)) return { success: false, message: "処理中です" };

      startFlight(id);

      // 楽観的アップデート
      setFavoritedIds((prev) => new Set(prev).add(id));
      broadcast({ type: "ADD", id });

      // サーバー処理開始
      try {
        const result = await addFavoriteAction({ id, isDirectory });
        if (!result.success) {
          // 失敗時のロールバック
          await revalidateFavorite(id, isDirectory);
        }
        return result;
      } finally {
        finishFlight(id);
      }
    },
    [broadcast, finishFlight, isInFlight, startFlight]
  );

  // お気に入り解除
  const removeFavorite = useCallback(
    async (id: string, isDirectory: boolean) => {
      if (isInFlight(id)) return { success: false, message: "処理中です" };

      startFlight(id);

      // 楽観的アップデート
      setFavoritedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      broadcast({ type: "REMOVE", id });

      // サーバー処理開始
      try {
        const result = await removeFavoriteAction({ id, isDirectory });
        if (!result.success) {
          // 失敗時のロールバック
          await revalidateFavorite(id, isDirectory);
        }
        return result;
      } finally {
        finishFlight(id);
      }
    },
    [broadcast, finishFlight, isInFlight, startFlight]
  );

  // お気に入り状態をトグル
  const toggleFavorite = useCallback(
    (id: string, isDirectory: boolean) => {
      const { isFavorite } = getFavorite(id);
      return isFavorite
        ? removeFavorite(id, isDirectory)
        : addFavorite(id, isDirectory);
    },
    [getFavorite, removeFavorite, addFavorite]
  );

  const revalidateManyFavorites = useCallback(
    async ({
      entries,
    }: {
      entries: {
        id: string;
        isDirectory: boolean;
      }[];
    }) => {
      // サーバー処理開始
      try {
        const revalidateResult = await revalidateManyFavoritesAction({
          entries,
        });

        if (revalidateResult.success) {
          setFavoritedIds((prev) => {
            const next = new Set(prev);
            const { favoriteFiles, favoriteFolders } = revalidateResult;

            const freshData = new Set([
              ...favoriteFiles.map((f) => f.fileId),
              ...favoriteFolders.map((f) => f.folderId),
            ]);

            entries
              .map((f) => f.id)
              .forEach((id) => {
                if (freshData.has(id)) {
                  next.add(id);
                } else {
                  next.delete(id);
                }
              });
            return next;
          });
        }
      } finally {
      }
    },
    []
  );

  // 一括お気に入り追加
  const addManyFavorites = useCallback(
    async ({
      entries,
    }: {
      entries: {
        id: string;
        isDirectory: boolean;
      }[];
    }) => {
      const validIds = entries
        .map((e) => e.id)
        .filter((id) => {
          const current = getFavorite(id);

          // すでにお気に入りの場合除外
          if (current.isFavorite) {
            return false;
          }

          // 処理中のIDは除外
          if (isInFlight(id)) {
            return false;
          }

          return true;
        });

      if (validIds.length === 0)
        return { success: false, message: "処理するIDがありません" };

      // すべてのIDを Flight 状態にする
      startFlight(...validIds);

      // 楽観的アップデート
      setFavoritedIds((prev) => {
        const next = new Set(prev);
        validIds.forEach((id) => next.add(id));
        return next;
      });

      // タブ間同期 (メッセージ送信)
      broadcast({ type: "ADD_MANY", ids: validIds });

      // サーバー処理開始
      try {
        const result = await addManyFavoritesAction({
          entries,
        });

        if (!result.success) {
          // 失敗時のロールバック
          await revalidateManyFavorites({ entries });
        }

        return result;
      } finally {
        finishFlight(...validIds);
      }
    },
    [broadcast, finishFlight, getFavorite, isInFlight, startFlight]
  );

  // 一括お気に入り解除
  const removeManyFavorites = useCallback(
    async ({
      entries,
    }: {
      entries: {
        id: string;
        isDirectory: boolean;
      }[];
    }) => {
      const validIds = entries
        .map((e) => e.id)
        .filter((id) => {
          const current = getFavorite(id);

          // お気に入りの場合は処理対象
          if (current.isFavorite) {
            return true;
          }

          // 処理中のIDは除外
          if (isInFlight(id)) {
            return false;
          }

          return true;
        });

      if (validIds.length === 0)
        return { success: false, message: "処理するIDがありません" };

      // すべてのIDを Flight 状態にする
      startFlight(...validIds);

      // 楽観的アップデート
      setFavoritedIds((prev) => {
        const next = new Set(prev);
        validIds.forEach((id) => next.delete(id));
        return next;
      });

      // タブ間同期
      broadcast({ type: "REMOVE_MANY", ids: validIds });

      // サーバー処理開始
      try {
        const result = await removeManyFavoritesAction({ entries });

        if (!result.success) {
          // 失敗時のロールバック
          await revalidateManyFavorites({ entries });
        }

        return result;
      } finally {
        finishFlight(...validIds);
      }
    },
    [broadcast, finishFlight, getFavorite, isInFlight, startFlight]
  );

  return {
    getFavorite,
    addFavorite,
    addManyFavorites,
    removeFavorite,
    removeManyFavorites,
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

  const startFlight = useCallback((...ids: string[]) => {
    setInFlight((prev) => {
      const next = new Set(prev);
      ids.forEach((p) => next.add(p));
      return next;
    });
  }, []);

  const finishFlight = useCallback((...ids: string[]) => {
    setInFlight((prev) => {
      const next = new Set(prev);
      ids.forEach((p) => next.delete(p));
      return next;
    });
  }, []);

  const isInFlight = useCallback((id: string) => inFlight.has(id), [inFlight]);

  return { startFlight, finishFlight, isInFlight };
}
