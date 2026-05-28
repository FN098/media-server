import { ActionDropdownMenu } from "@/components/ui/dropdown-menus/action-dropdown-menu";
import { FilterDropdownMenu } from "@/components/ui/dropdown-menus/filter-dropdown-menu";
import { SortDropdownMenu } from "@/components/ui/dropdown-menus/sort-dropdown-menu";
import { ExplorerToolbarDialogs } from "@/components/ui/pages/explorer/components/explorer-dialogs";
import { ExplorerDialogs } from "@/components/ui/pages/explorer/hooks/use-explorer-dialogs";
import { ExplorerFavorites } from "@/components/ui/pages/explorer/hooks/use-explorer-favorites";
import { useExplorerFilter } from "@/components/ui/pages/explorer/hooks/use-explorer-filter";
import { ExplorerFiltering } from "@/components/ui/pages/explorer/hooks/use-explorer-filtering";
import { useExplorerSort } from "@/components/ui/pages/explorer/hooks/use-explorer-sort";
import {
  ToolbarActionContext,
  useExplorerActions,
} from "@/components/ui/pages/explorer/hooks/use-explorer-toolbar";
import { FilterResultText } from "@/components/ui/texts/filter-result-text";
import { MediaListing } from "@/lib/media/types";

interface ExplorerToolbarProps {
  listing: MediaListing;
  filtering: ExplorerFiltering;
  dialogs: ExplorerDialogs;
  favorites: ExplorerFavorites;
}

export function ExplorerToolbar({
  listing,
  filtering,
  dialogs,
  favorites,
}: ExplorerToolbarProps) {
  const sort = useExplorerSort();
  const filter = useExplorerFilter({ filtering, dialogs });
  const actions = useExplorerActions();

  const actionContext: ToolbarActionContext = {
    listing,
    filtering,
    dialogs,
    favorites,
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-grow">
        {/* ソート */}
        <div className="w-full sm:w-[160px]">
          <SortDropdownMenu
            value={sort.control.value}
            onChange={sort.control.apply}
            options={sort.options}
          />
        </div>

        {/* フィルター */}
        <div className="w-full sm:w-[160px]">
          <FilterDropdownMenu
            items={filter.menuItems}
            onReset={filter.control.reset}
            canReset={filter.control.canReset}
          />
        </div>

        {/* アクション */}
        <div className="w-full sm:w-[160px]">
          <ActionDropdownMenu
            items={actions.toolbarActionItems}
            context={actionContext}
          />
        </div>
      </div>

      {/* 件数 */}
      <FilterResultText
        totalCount={filtering.totalCount}
        filteredCount={filtering.filteredCount}
        isFiltered={filtering.isFiltered}
        className="ml-auto sm:ml-auto min-w-[120px] text-right pt-2 sm:pt-0"
      />

      {/* ダイアログ */}
      <ExplorerToolbarDialogs dialogs={dialogs} filtering={filtering} />
    </div>
  );
}
