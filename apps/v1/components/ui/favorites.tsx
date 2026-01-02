"use client";

import { ExplorerGridView } from "@/components/ui/explorer-grid-view";
import { ListView } from "@/components/ui/explorer-list-view";
import { MediaViewer } from "@/components/ui/media-viewer";
import { TagEditSheet } from "@/components/ui/tag-edit-sheet";
import { isMedia } from "@/lib/media/media-types";
import { MediaNode } from "@/lib/media/types";
import { getClientExplorerPath } from "@/lib/path/helpers";
import { useExplorer } from "@/providers/explorer-listing-provider";
import { FavoritesProvider } from "@/providers/favorites-provider";
import { QueryClientWrapperProvider } from "@/providers/query-client-provider";
import { useSearch } from "@/providers/search-provider";
import { SelectionProvider } from "@/providers/selection-provider";
import { useViewMode } from "@/providers/view-mode-provider";
import { cn } from "@/shadcn/lib/utils";
import { useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";

export function Favorites() {
  const { listing, index, modal, openMedia, closeMedia } = useExplorer();
  const router = useRouter();
  const { view } = useViewMode();

  // 検索フィルター機能
  const { query } = useSearch();
  const lowerQuery = useMemo(() => query.toLowerCase(), [query]);
  const filtered = useMemo(() => {
    return listing.nodes
      .filter((e) => e.isDirectory || isMedia(e.type))
      .filter((e) => e.name.toLowerCase().includes(lowerQuery));
  }, [listing.nodes, lowerQuery]);

  const mediaOnly = useMemo(
    () => filtered.filter((e) => isMedia(e.type)),
    [filtered]
  );

  const mediaPath = filtered[index ?? 0]?.path;
  const mediaIndex =
    mediaPath != null
      ? Math.max(
          0,
          mediaOnly.findIndex((e) => e.path === mediaPath)
        )
      : 0;

  // フォルダ/ファイルオープン
  const handleOpen = useCallback(
    (nodes: MediaNode[], index: number) => {
      if (index < 0 || index > nodes.length) return;
      const node = nodes[index];

      // フォルダ
      if (node.isDirectory) {
        const href = getClientExplorerPath(node.path);
        router.push(href);
        return;
      }

      // ファイル
      if (isMedia(node.type)) {
        openMedia(index);
        return;
      }

      toast.warning("このファイル形式は対応していません");
    },
    [openMedia, router]
  );

  // お気に入り設定
  const initialFavorites = useMemo(
    () => Object.fromEntries(filtered.map((n) => [n.path, n.isFavorite])),
    [filtered]
  );

  return (
    <div
      className={cn(
        "flex-1 overflow-auto",
        view === "grid" && "p-4",
        view === "list" && "px-4"
      )}
    >
      <FavoritesProvider favoritePaths={initialFavorites}>
        <SelectionProvider>
          {/* グリッドビュー */}
          {view === "grid" && (
            <div>
              <ExplorerGridView
                nodes={filtered}
                onOpen={(index) => void handleOpen(filtered, index)}
              />
            </div>
          )}

          {/* リストビュー */}
          {view === "list" && (
            <div>
              <ListView
                nodes={filtered}
                onOpen={(index) => void handleOpen(filtered, index)}
              />
            </div>
          )}

          {/* タグエディター */}
          <QueryClientWrapperProvider>
            <TagEditSheet allNodes={mediaOnly} />
          </QueryClientWrapperProvider>
        </SelectionProvider>

        {/* ビューワ */}
        {modal && index != null && (
          <MediaViewer
            items={mediaOnly}
            initialIndex={mediaIndex}
            onClose={closeMedia}
          />
        )}
      </FavoritesProvider>
    </div>
  );
}
