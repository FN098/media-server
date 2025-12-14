"use client";

import { GridView } from "@/app/components/ui/grid-view";
import { ListView } from "@/app/components/ui/list-view";
import { MediaViewer } from "@/app/components/ui/media-viewer";
import { useGridView } from "@/app/hooks/use-grid-view";
import { useMediaViewer } from "@/app/hooks/use-media-viewer";
import { getClientExplorerPath } from "@/app/lib/path-helpers";
import { MediaFsListing, MediaFsNode } from "@/app/lib/types";
import { useSearch } from "@/app/providers/search-provider";
import { useViewMode } from "@/app/providers/view-mode-provider";
import { cn } from "@/shadcn/lib/utils";
import { useRouter } from "next/navigation";
import { useMemo, useRef } from "react";

type ExplorerProps = {
  listing: MediaFsListing;
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
    currentFilePath,
    currentMediaNode,
    hasNext,
    hasPrev,
    openViewer,
    closeViewer,
    goToNext,
    goToPrev,
  } = useMediaViewer(listing.nodes);

  // Search filter
  const lowerSearch = useMemo(() => search.toLowerCase(), [search]);
  const filtered = useMemo(() => {
    const nodes = listing.nodes;
    if (!lowerSearch) return nodes;

    return nodes.filter((e) => e.name.toLowerCase().includes(lowerSearch));
  }, [listing.nodes, lowerSearch]);

  // Open File/Folder
  const handleOpen = (node: MediaFsNode) => {
    if (node.isDirectory) {
      const href = getClientExplorerPath(node.path);
      router.push(href);
    } else {
      openViewer(node);
    }
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

      {viewerOpen && currentFilePath && currentMediaNode && (
        <MediaViewer
          filePath={currentFilePath}
          mediaNode={currentMediaNode}
          onClose={closeViewer}
          onNext={goToNext}
          onPrev={goToPrev}
          hasNext={hasNext}
          hasPrev={hasPrev}
        />
      )}
    </div>
  );
}
