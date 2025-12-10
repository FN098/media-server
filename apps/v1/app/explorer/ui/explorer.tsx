"use client";

import { ExplorerBreadcrumbs } from "@/app/explorer/ui/breadcrumbs";
import { Search } from "@/app/explorer/ui/search";
import { ViewMode } from "@/app/explorer/ui/types";
import { ViewModeSwitch } from "@/app/explorer/ui/view-mode-switch";
import { GridView } from "@/app/explorer/ui/views/grid";
import { ListView } from "@/app/explorer/ui/views/list";
import { MediaFsListing } from "@/app/lib/media/types";
import { useMemo, useState } from "react";

export default function Explorer({ data }: { data: MediaFsListing }) {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ViewMode>("grid");

  const lowerSearch = useMemo(() => search.toLowerCase(), [search]);

  // Search filter
  const filtered = useMemo(() => {
    const nodes = data.nodes;
    if (!lowerSearch) return nodes;

    return data.nodes.filter((e) => e.name.toLowerCase().includes(lowerSearch));
  }, [data.nodes, lowerSearch]);

  return (
    <div className="space-y-4 p-4">
      {/* ===== Top Bar ===== */}
      <div className="flex items-center gap-2">
        <ExplorerBreadcrumbs />
        <div className="flex-1" />
        <Search value={search} setValue={setSearch} />
        <ViewModeSwitch value={view} setValue={setView} />
      </div>

      {/* ===== Content ===== */}
      <div className={view === "grid" ? "block" : "hidden"}>
        <GridView data={filtered} />
      </div>

      <div className={view === "list" ? "block" : "hidden"}>
        <ListView data={filtered} />
      </div>
    </div>
  );
}
