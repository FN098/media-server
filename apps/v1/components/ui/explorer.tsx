"use client";

import { GridView } from "@/components/ui/grid-view";
import { ListView } from "@/components/ui/list-view";
import { MediaViewer } from "@/components/ui/media-viewer";
import { useGridView } from "@/hooks/use-grid-view";
import { useMediaViewer } from "@/hooks/use-media-viewer";
import { isMedia } from "@/lib/media/detector";
import { MediaListing, MediaNode } from "@/lib/media/types";
import { getClientExplorerPath } from "@/lib/path-helpers";
import { FavoriteProvider } from "@/providers/favorite-provider";
import { useSearch } from "@/providers/search-provider";
import { useViewMode } from "@/providers/view-mode-provider";
import { cn } from "@/shadcn/lib/utils";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

type ExplorerProps = {
  listing: MediaListing;
};

export function Explorer({ listing }: ExplorerProps) {
  const { query } = useSearch();
  const { view } = useViewMode();
  const router = useRouter();
  const [initialIndex, setInitialIndex] = useState(0);

  // Media filter
  const lowerQuery = useMemo(() => query.toLowerCase(), [query]);
  const filtered = useMemo(() => {
    return listing.nodes
      .filter((e) => e.isDirectory || isMedia(e.type))
      .filter((e) => e.name.toLowerCase().includes(lowerQuery));
  }, [listing.nodes, lowerQuery]);

  // GridView config
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const { columnCount, columnWidth, rowHeight } = useGridView(gridContainerRef);

  // MediaViewer config
  const { viewerOpen, openViewer, closeViewer } = useMediaViewer();

  // Open file/folder
  const handleOpen = (node: MediaNode, index: number) => {
    if (node.isDirectory) {
      const href = getClientExplorerPath(node.path);
      router.push(href);
      return;
    }

    if (isMedia(node.type)) {
      openViewer();
      setInitialIndex(index);
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
        <div
          className={view === "grid" ? "block" : "hidden"}
          ref={gridContainerRef}
        >
          <GridView
            nodes={filtered}
            columnCount={columnCount}
            columnWidth={columnWidth}
            rowHeight={rowHeight}
            onOpen={handleOpen}
          />
        </div>

        <div className={view === "list" ? "block" : "hidden"}>
          <ListView nodes={filtered} onOpen={handleOpen} />
        </div>

        {viewerOpen && (
          <MediaViewer
            items={filtered}
            initialIndex={initialIndex}
            onClose={closeViewer}
          />
        )}
      </FavoriteProvider>
    </div>
  );
}
