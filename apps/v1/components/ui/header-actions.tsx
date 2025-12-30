"use client";

import { Search } from "@/components/ui/search";
import { ViewModeSwitch } from "@/components/ui/view-mode-switch";
import { useSearchOptional } from "@/providers/search-provider";
import { useViewModeOptional } from "@/providers/view-mode-provider";
import { Separator } from "@/shadcn/components/ui/separator";

export function HeaderActions({
  searchEnabled,
  viewModeEnabled,
}: {
  searchEnabled: boolean;
  viewModeEnabled: boolean;
}) {
  const searchCtx = useSearchOptional();
  const viewCtx = useViewModeOptional();

  return (
    <div className="ml-auto flex items-center gap-2">
      {searchEnabled && searchCtx && (
        <Search
          value={searchCtx.query}
          setValue={searchCtx.setQuery}
          className="w-[180px] shrink-0"
        />
      )}

      <Separator orientation="vertical" className="h-6" />

      {viewModeEnabled && viewCtx && (
        <ViewModeSwitch
          value={viewCtx.view}
          setValue={viewCtx.setView}
          className="shrink-0"
        />
      )}
    </div>
  );
}
