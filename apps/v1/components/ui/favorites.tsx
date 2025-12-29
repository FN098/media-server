"use client";

import { GridView } from "@/components/ui/grid-view";
import { ListView } from "@/components/ui/list-view";
import { MediaViewer } from "@/components/ui/media-viewer";
import { useExplorerNavigation } from "@/hooks/use-explorer-navigation";
import { isMedia } from "@/lib/media/detector";
import { MediaNode } from "@/lib/media/types";
import { getClientExplorerPath } from "@/lib/path-helpers";
import { FavoriteProvider } from "@/providers/favorite-provider";
import { useSearch } from "@/providers/search-provider";
import { useViewMode } from "@/providers/view-mode-provider";
import { cn } from "@/shadcn/lib/utils";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { toast } from "sonner";

type FavoritesProps = {
  nodes: MediaNode[];
};

export function Favorites({ nodes }: FavoritesProps) {
  const { query } = useSearch();
  const { view } = useViewMode();
  const router = useRouter();

  // Media filter
  const lowerQuery = useMemo(() => query.toLowerCase(), [query]);
  const filtered = useMemo(() => {
    return nodes
      .filter((e) => e.isDirectory || isMedia(e.type))
      .filter((e) => e.name.toLowerCase().includes(lowerQuery));
  }, [nodes, lowerQuery]);

  // Modal config
  const { index, modal, openMedia, closeMedia } = useExplorerNavigation(
    filtered.length
  );

  // Open file/folder
  const handleOpen = (node: MediaNode, index: number) => {
    if (node.isDirectory) {
      const href = getClientExplorerPath(node.path);
      router.push(href);
      return;
    }

    if (isMedia(node.type)) {
      openMedia(index);
      return;
    }

    toast.warning("このファイル形式は対応していません");
  };

  // Favorites
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
        <div className={cn(view === "grid" ? "block" : "hidden")}>
          <GridView nodes={filtered} onOpen={handleOpen} />
        </div>

        <div
          className={cn(view === "list" ? "block" : "hidden", "w-full h-full")}
        >
          <ListView nodes={filtered} onOpen={handleOpen} />
        </div>

        {modal && index != null && (
          <MediaViewer
            items={filtered}
            initialIndex={index}
            onClose={closeMedia}
          />
        )}
      </FavoriteProvider>
    </div>
  );
}
