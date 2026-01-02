import { useExplorerQuery } from "@/hooks/use-explorer-query";
import { isMedia } from "@/lib/media/media-types";
import { MediaListing } from "@/lib/media/types";
import { getClientExplorerPath } from "@/lib/path/helpers";
import { IndexLike } from "@/lib/query/types";
import { normalizeIndex } from "@/lib/query/utils";
import { isOutOfBounds } from "@/lib/utils/array";
import { isMatchJapanese } from "@/lib/utils/search";
import { useSearchContext } from "@/providers/search-provider";
import { useSelectionContext } from "@/providers/selection-provider";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

export function useExplorer(listing: MediaListing) {
  useExplorerQuery();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { query } = useSearchContext();
  const {
    selectedKeys: selectedPaths,
    selectKeys: selectPaths,
    clearSelection,
    selectedCount,
    setIsSelectionMode,
  } = useSelectionContext();
  const { nodes: allNodes } = listing;
  const [modal, setModal] = useState(false);
  const [index, setIndex] = useState<number | null>(null);

  // フィルターノードリスト
  const searchFiltered = useMemo(() => {
    if (!query.trim()) return allNodes;
    return allNodes.filter((e) => isMatchJapanese(e.name, query));
  }, [allNodes, query]);

  // メディアノードリスト
  const mediaOnly = useMemo(
    () => searchFiltered.filter((e) => isMedia(e.type)),
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

  // メディアノードリストのインデックスを計算
  const getMediaIndex = useCallback(
    (path: string) => {
      if (mediaOnlyMap.has(path)) return mediaOnlyMap.get(path)!;
      return null;
    },
    [mediaOnlyMap]
  );

  const navigate = useCallback(
    (path?: string | null, replace?: boolean) => {
      const baseUrl = path ? encodeURI(getClientExplorerPath(path)) : pathname;
      const params = new URLSearchParams();
      if (index !== null) params.set("at", String(index));
      if (modal) params.set("modal", "true");
      if (query.trim()) params.set("q", query.trim());
      const url = `${baseUrl}?${params}`;
      if (replace) {
        router.replace(url);
      } else {
        router.push(url);
      }
    },
    [index, modal, pathname, query, router]
  );

  const openViewer = useCallback(
    (path: string) => {
      const index = getMediaIndex(path);
      if (index !== null) {
        setModal(true);
        setIndex(index);
        requestAnimationFrame(() => navigate());
      }
    },
    [getMediaIndex, navigate]
  );

  const closeViewer = useCallback(() => {
    setModal(false);
    setIndex(null);
    requestAnimationFrame(() => navigate());
  }, [navigate]);

  const openFolder = useCallback(
    (path: string, at?: IndexLike) => {
      const baseUrl = encodeURI(getClientExplorerPath(path));
      const params = new URLSearchParams(searchParams);
      if (at !== undefined) params.set("at", String(at));
      const url = `${baseUrl}?${params}`;
      router.push(url);
    },
    [router, searchParams]
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
      if (listing.next == null) return;
      openFolder(listing.next, at);
    },
    [listing.next, openFolder]
  );

  const selectAllMedia = useCallback(() => {
    const paths = mediaOnly.map((n) => n.path);
    selectPaths(paths);
  }, [mediaOnly, selectPaths]);

  // 選択モード
  useEffect(() => {
    if (selectedCount === 0) {
      setIsSelectionMode(false);
    } else {
      setIsSelectionMode(true);
    }
  }, [selectedCount, setIsSelectionMode]);

  return {
    selectedPaths,
    listing,
    searchFiltered,
    mediaOnly,
    selected,
    modal,
    index,
    setIndex,
    openViewer,
    closeViewer,
    openFolder,
    getMediaNode,
    openNextFolder,
    openPrevFolder,
    selectAllMedia,
    clearSelection,
  };
}
