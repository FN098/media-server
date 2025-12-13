"use client";

import { Breadcrumbs } from "@/app/components/ui/breadcrumbs";
import { Search } from "@/app/components/ui/search";
import { ViewModeSwitch } from "@/app/components/ui/view-mode-switch";
import { useBreadcrumbs } from "@/app/hooks/use-breadcrumbs";
import { useSearch } from "@/app/providers/search-provider";
import { useViewMode } from "@/app/providers/view-mode-provider";
import { SidebarTrigger } from "@/shadcn/components/ui/sidebar";
import { useIsMobile } from "@/shadcn/hooks/use-mobile";

export function Header() {
  const { search, setSearch } = useSearch();
  const { view, setView } = useViewMode();
  const isMobile = useIsMobile();
  const breadcrumbs = useBreadcrumbs();

  return (
    <>
      <header className="sticky top-0 left-0 right-0 z-5 flex flex-wrap items-center gap-2 bg-white dark:bg-gray-900 p-2 shadow">
        {isMobile && <SidebarTrigger />}
        <Breadcrumbs
          items={breadcrumbs}
          className="shrink-0"
          options={{
            threshold: 10,
          }}
        />
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
