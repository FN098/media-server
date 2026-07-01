import { useExplorerActionMenu } from "@/feature/pages/explorer/hooks/use-explorer-action-menu";
import { useExplorerFilterMenu } from "@/feature/pages/explorer/hooks/use-explorer-filter-menu";
import { useExplorerSortMenu } from "@/feature/pages/explorer/hooks/use-explorer-sort-menu";
import { useExplorerContext } from "@/feature/pages/explorer/providers/explorer-provider";
import { FilterResultText } from "@/feature/text/ui/filter-result-text";
import { ActionDropdownMenu } from "@/feature/toolbar-menu/ui/action-dropdown-menu";
import { FilterDropdownMenu } from "@/feature/toolbar-menu/ui/filter-dropdown-menu";
import { SortDropdownMenu } from "@/feature/toolbar-menu/ui/sort-dropdown-menu";

export function ExplorerToolbar() {
  const { filtering, sort } = useExplorerContext();

  const filterMenu = useExplorerFilterMenu();
  const sortMenu = useExplorerSortMenu();
  const actionMenu = useExplorerActionMenu();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-grow">
        <div className="w-full sm:w-[160px]">
          <SortDropdownMenu
            value={sort.value}
            onChange={sort.apply}
            items={sortMenu.items}
          />
        </div>

        <div className="w-full sm:w-[160px]">
          <FilterDropdownMenu
            items={filterMenu.items}
            context={filterMenu.context}
            onReset={filtering.reset}
            canReset={filtering.canReset}
          />
        </div>

        <div className="w-full sm:w-[160px]">
          <ActionDropdownMenu
            items={actionMenu.items}
            context={actionMenu.context}
          />
        </div>
      </div>

      <FilterResultText
        totalCount={filtering.totalCount}
        filteredCount={filtering.filteredCount}
        isFiltered={filtering.isFiltered}
        className="ml-auto min-w-[120px] text-right"
      />
    </div>
  );
}
