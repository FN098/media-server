import { ActionDropdownMenu } from "@/components/ui/dropdown-menus/action-dropdown-menu";
import { FilterDropdownMenu } from "@/components/ui/dropdown-menus/filter-dropdown-menu";
import { SortDropdownMenu } from "@/components/ui/dropdown-menus/sort-dropdown-menu";
import { FilterResultText } from "@/components/ui/texts/filter-result-text";
import { useExplorerActionMenu } from "@/hooks/explorer/use-explorer-action-menu";
import { useExplorerFilterMenu } from "@/hooks/explorer/use-explorer-filter-menu";
import { useExplorerSortMenu } from "@/hooks/explorer/use-explorer-sort-menu";
import { useExplorerContext } from "@/providers/explorer-provider";

export function ExplorerToolbar() {
  const { filtering, sort } = useExplorerContext();
  const filterMenu = useExplorerFilterMenu();
  const sortMenu = useExplorerSortMenu();
  const actionMenu = useExplorerActionMenu();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-grow">
        {/* ソート */}
        <div className="w-full sm:w-[160px]">
          <SortDropdownMenu
            value={sort.value}
            onChange={sort.apply}
            items={sortMenu.items}
          />
        </div>

        {/* フィルター */}
        <div className="w-full sm:w-[160px]">
          <FilterDropdownMenu
            items={filterMenu.items}
            context={filterMenu.context}
            onReset={filtering.reset}
            canReset={filtering.canReset}
          />
        </div>

        {/* アクション */}
        <div className="w-full sm:w-[160px]">
          <ActionDropdownMenu
            items={actionMenu.items}
            context={actionMenu.context}
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
    </div>
  );
}
