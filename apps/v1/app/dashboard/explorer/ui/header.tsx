"use client";

import { ExplorerBreadcrumbs } from "@/app/dashboard/explorer/ui/breadcrumbs";
import { useSearch } from "@/app/dashboard/explorer/ui/providers/use-search";
import { useViewMode } from "@/app/dashboard/explorer/ui/providers/view-mode-provider";
import { Search } from "@/app/dashboard/explorer/ui/search";
import { ViewModeSwitch } from "@/app/dashboard/explorer/ui/view-mode-switch";
import { SidebarTrigger } from "@/shadcn/components/ui/sidebar";
import { useIsMobile } from "@/shadcn/hooks/use-mobile";

export function ExplorerHeader() {
  const { search, setSearch } = useSearch();
  const { view, setView } = useViewMode();
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-wrap items-center gap-2">
      {isMobile && <SidebarTrigger />}
      <ExplorerBreadcrumbs className="shrink-0" />
      <div className="flex-1 min-w-[150px]" />
      <div className="flex ml-auto">
        <Search value={search} setValue={setSearch} className="shrink-0" />
        <ViewModeSwitch value={view} setValue={setView} className="shrink-0" />
      </div>
    </div>
  );
}
