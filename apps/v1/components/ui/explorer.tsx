"use client";

import { GridView } from "@/components/ui/grid-view";
import { ListView } from "@/components/ui/list-view";
import { MediaViewer } from "@/components/ui/media-viewer";
import { useGridView } from "@/hooks/use-grid-view";
import { useMediaViewer } from "@/hooks/use-media-viewer";
import { isMedia } from "@/lib/media/detector";
import { MediaFsNode, MediaListing } from "@/lib/media/types";
import { getClientExplorerPath } from "@/lib/path-helpers";
import { useSearch } from "@/providers/search-provider";
import { useViewMode } from "@/providers/view-mode-provider";
import { cn } from "@/shadcn/lib/utils";
import { useRouter } from "next/navigation";
import { useMemo, useRef } from "react";
import { toast } from "sonner";

type ExplorerProps = {
  listing: MediaListing;
};

export function Explorer({ listing }: ExplorerProps) {
  const { search } = useSearch();
  const { view } = useViewMode();
  const router = useRouter();

  // GridView config
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const { columnCount, columnWidth, rowHeight } = useGridView(gridContainerRef);

  // MediaViewer config
  const {
    viewerOpen,
    mediaNodes,
    currentIndex,
    openViewerAt,
    closeViewer,
    setIndex,
  } = useMediaViewer(listing.nodes);

  // Search filter
  const lowerSearch = useMemo(() => search.toLowerCase(), [search]);
  const filtered = useMemo(() => {
    const nodes = listing.nodes;
    if (!lowerSearch) return nodes;

    return nodes.filter((e) => e.name.toLowerCase().includes(lowerSearch));
  }, [listing.nodes, lowerSearch]);

  // Open file/folder
  const handleOpen = (node: MediaFsNode) => {
    if (node.isDirectory) {
      const href = getClientExplorerPath(node.path);
      router.push(href);
      return;
    }

    if (isMedia(node)) {
      openViewerAt(node);
      return;
    }

    toast.warning("このファイル形式は対応していません");
  };

  return (
    <div
      className={cn(
        "flex-1 overflow-auto",
        view === "grid" && "p-4",
        view === "list" && "px-4"
      )}
    >
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

      {viewerOpen && currentIndex !== -1 && (
        <MediaViewer
          items={mediaNodes}
          index={currentIndex}
          onClose={closeViewer}
          onChangeIndex={setIndex}
        />
      )}
    </div>
  );
}
