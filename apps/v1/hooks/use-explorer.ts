import { useSetExplorerQuery } from "@/hooks/use-explorer-query";
import { isMedia } from "@/lib/media/media-types";
import { MediaListing, MediaNode } from "@/lib/media/types";
import { IndexLike } from "@/lib/query/types";
import { normalizeIndex } from "@/lib/query/utils";
import { isOutOfBounds } from "@/lib/utils/array";
import { isMatchJapanese } from "@/lib/utils/search";
import { useSearchContext } from "@/providers/search-provider";
import { useSelectionContext } from "@/providers/selection-provider";
import { useCallback, useEffect, useMemo } from "react";
import { toast } from "sonner";

export function useExplorer(listing: MediaListing) {
  const { query } = useSearchContext();
  const {
    selectedKeys: selectedPaths,
    selectKeys: selectPaths,
    clearSelection,
    selectedCount,
    setIsSelectionMode,
  } = useSelectionContext();
  const { nodes: allNodes } = listing;

  const trimmedQuery = query.trim();

  // フィルターノードリスト
  const searchFiltered = useMemo(() => {
    if (!trimmedQuery) return allNodes;
    return allNodes.filter((n) => isMatchJapanese(n.name, trimmedQuery));
  }, [allNodes, trimmedQuery]);

  // メディアノードリスト
  const mediaOnly = useMemo(
    () => searchFiltered.filter((n) => isMedia(n.type)),
    [searchFiltered]
  );

  // 選択済みノードリスト
  const selected = useMemo(
    () => searchFiltered.filter((n) => selectedPaths.has(n.path)),
    [searchFiltered, selectedPaths]
  );

  // メディアノードリストからノードを取得
  const getMediaNode = useCallback(
    (at: IndexLike) => {
      const index = normalizeIndex(at, mediaOnly.length);
      if (isOutOfBounds(index, mediaOnly)) return null;
      return mediaOnly[index];
    },
    [mediaOnly]
  );

  // メディアノードリストのインデックスを計算するためのマップ
  const mediaOnlyMap = useMemo(
    () => new Map(mediaOnly.map((n, index) => [n.path, index])),
    [mediaOnly]
  );

  // メディアノードリストのインデックスを取得
  const getMediaIndex = useCallback(
    (path: string) => {
      if (mediaOnlyMap.has(path)) return mediaOnlyMap.get(path)!;
      return null;
    },
    [mediaOnlyMap]
  );

  const setExplorerQuery = useSetExplorerQuery();

  const openViewer = useCallback(
    (path: string) => {
      const index = getMediaIndex(path);
      if (index == null) return;
      setExplorerQuery({ modal: true, at: index }, { history: "push" });
    },
    [getMediaIndex, setExplorerQuery]
  );

  const closeViewer = useCallback(() => {
    setExplorerQuery({ modal: false, at: null }, { history: "push" });
  }, [setExplorerQuery]);

  const openFolder = useCallback(
    (path: string, at?: IndexLike) => {
      setExplorerQuery({ at: at ?? null }, { path, history: "push" });
    },
    [setExplorerQuery]
  );

  const openNextFolder = useCallback(
    (at: IndexLike) => {
      if (listing.next == null) return;
      openFolder(listing.next, at);
    },
    [listing.next, openFolder]
  );

  const openPrevFolder = useCallback(
    (at: IndexLike) => {
      if (listing.prev == null) return;
      openFolder(listing.prev, at);
    },
    [listing.prev, openFolder]
  );

  const openNode = useCallback(
    (node: MediaNode) => {
      // フォルダ
      if (node.isDirectory) {
        openFolder(node.path);
        return;
      }

      // ファイル
      if (isMedia(node.type)) {
        openViewer(node.path);
        return;
      }

      toast.warning("このファイル形式は対応していません");
    },
    [openFolder, openViewer]
  );

  const selectAllMedia = useCallback(() => {
    const paths = mediaOnly.map((n) => n.path);
    selectPaths(paths);
  }, [mediaOnly, selectPaths]);

  // 選択モード
  useEffect(() => {
    setIsSelectionMode(selectedCount > 0);
  }, [selectedCount, setIsSelectionMode]);

  return {
    listing,
    searchFiltered,
    mediaOnly,
    selected,
    openViewer,
    closeViewer,
    openFolder,
    getMediaNode,
    openNextFolder,
    openPrevFolder,
    openNode,
    selectAllMedia,
    clearSelection,
  };
}
