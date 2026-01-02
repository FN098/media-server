import { isMedia } from "@/lib/media/media-types";
import { MediaListing } from "@/lib/media/types";
import { isMatchJapanese } from "@/lib/utils/search";
import { IndexLike } from "@/lib/view/types";
import { useSearchContext } from "@/providers/search-provider";
import { useSelectionContext } from "@/providers/selection-provider";
import { useCallback, useMemo } from "react";

export function useExplorerListing(listing: MediaListing) {
  const { query } = useSearchContext();
  const { selectedKeys: selectedPaths } = useSelectionContext();
  const { nodes: allNodes } = listing;

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
      // first や last を実際のインデックスに変換
      const normalizeIndex = () => {
        if (at === "first") return 0;
        if (at === "last") return mediaOnly.length - 1;
        return Number(at);
      };
      const index = normalizeIndex();
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

  return useMemo(
    () => ({
      selectedPaths,
      listing,
      searchFiltered,
      mediaOnly,
      selected,
      getMediaNode,
      getMediaIndex,
    }),
    [
      listing,
      mediaOnly,
      searchFiltered,
      selectedPaths,
      selected,
      getMediaNode,
      getMediaIndex,
    ]
  );
}
