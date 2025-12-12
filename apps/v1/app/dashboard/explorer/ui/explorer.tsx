"use client";

import { useGridConfig } from "@/app/dashboard/explorer/ui/hooks/use-grid-config";
import { useMediaViewer } from "@/app/dashboard/explorer/ui/hooks/use-media-viewer";
import { MediaViewer } from "@/app/dashboard/explorer/ui/media-viewer";
import { useSearch } from "@/app/dashboard/explorer/ui/providers/search-provider";
import { useViewMode } from "@/app/dashboard/explorer/ui/providers/view-mode-provider";
import { GridView } from "@/app/dashboard/explorer/ui/views/grid";
import { ListView } from "@/app/dashboard/explorer/ui/views/list";
import { MediaFsListing } from "@/app/lib/media/types";
import { useMemo, useRef } from "react";

type ExplorerProps = {
  listing: MediaFsListing;
};

export default function Explorer({ listing }: ExplorerProps) {
  const { search } = useSearch();
  const { view } = useViewMode();

  // GridView config
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const { columnCount, columnWidth, rowHeight } =
    useGridConfig(gridContainerRef);

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

  return (
    <div className="space-y-4 p-4">
      <div
        className={view === "grid" ? "block" : "hidden"}
        ref={gridContainerRef}
      >
        <GridView
          data={filtered}
          columnCount={columnCount}
          columnWidth={columnWidth}
          rowHeight={rowHeight}
          onFileOpen={openViewer}
        />
      </div>

      <div className={view === "list" ? "block" : "hidden"}>
        <ListView data={filtered} />
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
