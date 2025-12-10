"use client";

import { BreadcrumbLinkItem, Breadcrumbs } from "@/app/explorer/ui/breadcrumbs";
import { Search } from "@/app/explorer/ui/search";
import { ViewMode } from "@/app/explorer/ui/types";
import { ViewModeSwitch } from "@/app/explorer/ui/view-mode-switch";
import { GridView } from "@/app/explorer/ui/views/grid";
import { ListView } from "@/app/explorer/ui/views/list";
import { MediaFsListing } from "@/app/lib/media/types";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";

export default function Explorer({ data }: { data: MediaFsListing }) {
  const pathname = usePathname();
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ViewMode>("grid");

  // pathParts から Breadcrumb[] を作る
  const pathParts = pathname
    .replace(/^\/explorer\/?/, "")
    .split("/")
    .filter(Boolean)
    .map(decodeURIComponent);

  const breadcrumbs: BreadcrumbLinkItem[] = [
    { key: "home", label: "HOME", href: "/explorer" },
    ...pathParts.map((part, i) => ({
      key: part,
      label: part,
      href: "/explorer/" + pathParts.slice(0, i + 1).join("/"),
    })),
  ];

  // Search filter
  const filtered = useMemo(() => {
    return data.nodes.filter((e) =>
      e.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [data, search]);

  return (
    <div className="space-y-4 p-4">
      {/* ===== Top Bar ===== */}
      <div className="flex items-center gap-2">
        <Breadcrumbs items={breadcrumbs} options={{ threshold: 5 }} />
        <div className="flex-1" />
        <Search value={search} setValue={setSearch} />
        <ViewModeSwitch value={view} setValue={setView} />
      </div>

      {/* ===== Content ===== */}
      {view === "list" && <ListView data={filtered} />}
      {view === "grid" && <GridView data={filtered} />}
    </div>
  );
}
