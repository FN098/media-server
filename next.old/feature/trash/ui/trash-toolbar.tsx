import { FilterResultText } from "@/feature/_old/text/ui/filter-result-text";
import { ActionDropdownMenu } from "@/feature/_old/toolbar-menu/ui/action-dropdown-menu";
import { FilterDropdownMenu } from "@/feature/_old/toolbar-menu/ui/filter-dropdown-menu";
import { SortDropdownMenu } from "@/feature/_old/toolbar-menu/ui/sort-dropdown-menu";
import { useTrashActionMenu } from "@/feature/_old/trash/hooks/use-trash-action-menu";
import { useTrashFilterMenu } from "@/feature/_old/trash/hooks/use-trash-filter-menu";
import { useTrashSortMenu } from "@/feature/_old/trash/hooks/use-trash-sort-menu";
import { useTrashContext } from "@/feature/_old/trash/providers/trash-provider";

export function TrashToolbar() {
  const { filtering, sort } = useTrashContext();

  const filterMenu = useTrashFilterMenu();
  const sortMenu = useTrashSortMenu();
  const actionMenu = useTrashActionMenu();

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
