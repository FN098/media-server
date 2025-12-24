"use client";

import { GridView } from "@/components/ui/grid-view-v2";
import { ListView } from "@/components/ui/list-view";
import { MediaViewer } from "@/components/ui/media-viewer";
import { useMediaViewer } from "@/hooks/use-media-viewer";
import { isMedia } from "@/lib/media/detector";
import { MediaNode } from "@/lib/media/types";
import { getClientExplorerPath } from "@/lib/path-helpers";
import { FavoriteProvider } from "@/providers/favorite-provider";
import { useSearch } from "@/providers/search-provider";
import { useViewMode } from "@/providers/view-mode-provider";
import { cn } from "@/shadcn/lib/utils";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type ExplorerProps = {
  nodes: MediaNode[];
};

export function Explorer({ nodes }: ExplorerProps) {
  const { query } = useSearch();
  const { view } = useViewMode();
  const router = useRouter();
  const [initialIndex, setInitialIndex] = useState(0);

  // Media filter
  const lowerQuery = useMemo(() => query.toLowerCase(), [query]);
  const filtered = useMemo(() => {
    return nodes
      .filter((e) => e.isDirectory || isMedia(e.type))
      .filter((e) => e.name.toLowerCase().includes(lowerQuery));
  }, [nodes, lowerQuery]);

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
        <div className={cn(view === "grid" ? "block" : "hidden")}>
          <GridView nodes={filtered} onOpen={handleOpen} />
        </div>

        <div
          className={cn(view === "list" ? "block" : "hidden", "w-full h-full")}
        >
          <ListView nodes={filtered} onOpen={handleOpen} />
        </div>

        {viewerOpen && (
          <MediaViewer
            items={filtered}
            initialIndex={initialIndex}
            onClose={closeViewer}
            options={{ openFolder: false }}
          />
        )}
      </FavoriteProvider>
    </div>
  );
}
