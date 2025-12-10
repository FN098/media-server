"use client";

import { ExplorerBreadcrumbs } from "@/app/explorer/ui/breadcrumbs";
import { useViewMode } from "@/app/explorer/ui/providers/view-mode-provider";
import { Search } from "@/app/explorer/ui/search";
import { ViewModeSwitch } from "@/app/explorer/ui/view-mode-switch";
import { GridView } from "@/app/explorer/ui/views/grid";
import { ListView } from "@/app/explorer/ui/views/list";
import { MediaFsListing } from "@/app/lib/media/types";
import { useIsMobile } from "@/shadcn/hooks/use-mobile";
import { useMemo, useState } from "react";

export default function Explorer({ data }: { data: MediaFsListing }) {
  const [search, setSearch] = useState("");
  const { view, setView } = useViewMode();

  const isMobile = useIsMobile();
  const columnCount = isMobile ? 3 : 6;
  const columnWidth = isMobile ? 100 : 200;
  const rowHeight = isMobile ? 120 : 220;

  const lowerSearch = useMemo(() => search.toLowerCase(), [search]);

  // Search filter
  const filtered = useMemo(() => {
    const nodes = data.nodes;
    if (!lowerSearch) return nodes;

    return nodes.filter((e) => e.name.toLowerCase().includes(lowerSearch));
  }, [data.nodes, lowerSearch]);

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <ExplorerBreadcrumbs />
        <div className="flex-1" />
        <Search value={search} setValue={setSearch} />
        <ViewModeSwitch value={view} setValue={setView} />
      </div>

      <div className={view === "grid" ? "block" : "hidden"}>
        <GridView
          data={filtered}
          columnCount={columnCount}
          columnWidth={columnWidth}
          rowHeight={rowHeight}
        />
      </div>

      <div className={view === "list" ? "block" : "hidden"}>
        <ListView data={filtered} />
      </div>
    </div>
  );
}
