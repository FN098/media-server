"use client";

import { GridView } from "@/components/ui/grid-view";
import { ListView } from "@/components/ui/list-view";
import { MediaViewer } from "@/components/ui/media-viewer";
import { TagEditorBar } from "@/components/ui/tag-editor-bar";
import { isMedia } from "@/lib/media/media-types";
import { MediaNode } from "@/lib/media/types";
import { getClientExplorerPath } from "@/lib/path/helpers";
import { useExplorer } from "@/providers/explorer-provider";
import { FavoriteProvider } from "@/providers/favorite-provider";
import { QueryProvider } from "@/providers/query-provider";
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

  // フォルダ/ファイルオープン
  const handleOpen = useCallback(
    (node: MediaNode, index: number) => {
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
      <FavoriteProvider initialFavorites={initialFavorites}>
        <SelectionProvider>
          {/* グリッドビュー */}
          <div className={cn(view === "grid" ? "block" : "hidden")}>
            <GridView nodes={filtered} onOpen={handleOpen} />
          </div>

          {/* リストビュー */}
          <div
            className={cn(
              view === "list" ? "block" : "hidden",
              "w-full h-full"
            )}
          >
            <ListView nodes={filtered} onOpen={handleOpen} />
          </div>

          {/* ビューワ */}
          {modal && index != null && (
            <MediaViewer
              items={mediaOnly}
              initialIndex={index}
              onClose={closeMedia}
            />
          )}

          {/* タグ編集バー */}
          <QueryProvider>
            <TagEditorBar allNodes={filtered} />
          </QueryProvider>
        </SelectionProvider>
      </FavoriteProvider>
    </div>
  );
}
