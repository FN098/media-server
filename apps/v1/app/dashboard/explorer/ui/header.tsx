"use client";

import { ExplorerBreadcrumbs } from "@/app/dashboard/explorer/ui/breadcrumbs";
import { useSearch } from "@/app/dashboard/explorer/ui/providers/search-provider";
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
    <>
      <header className="sticky top-0 left-0 right-0 z-5 flex flex-wrap items-center gap-2 bg-white dark:bg-gray-900 p-2 shadow">
        {isMobile && <SidebarTrigger />}
        <ExplorerBreadcrumbs className="shrink-0" />
        <div className="flex-1 min-w-[150px]" />
        <div className="flex ml-auto gap-2">
          <Search value={search} setValue={setSearch} className="shrink-0" />
          <ViewModeSwitch
            value={view}
            setValue={setView}
            className="shrink-0"
          />
        </div>
      </header>

      {/* 下のコンテンツにはヘッダー分の余白を */}
      <div className="pt-12">{/* メインコンテンツ */}</div>
    </>
  );
}
