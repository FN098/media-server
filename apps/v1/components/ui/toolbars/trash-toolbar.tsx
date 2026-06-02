import { ActionDropdownMenu } from "@/components/ui/dropdown-menus/action-dropdown-menu";
import { FilterDropdownMenu } from "@/components/ui/dropdown-menus/filter-dropdown-menu";
import { SortDropdownMenu } from "@/components/ui/dropdown-menus/sort-dropdown-menu";
import { FilterResultText } from "@/components/ui/texts/filter-result-text";
import { useSort } from "@/hooks/sort/use-sort";
import { useTrashActions } from "@/hooks/trash/use-trash-actions";
import { useTrashFilter } from "@/hooks/trash/use-trash-filter";
import { useTrashSort } from "@/hooks/trash/use-trash-sort";
import { useTrashContext } from "@/providers/trash-provider";
import { useMemo } from "react";

export function TrashToolbar() {
  const { listing, filtering, dialogs } = useTrashContext();

  const sort = useSort();

  const { toolbarFilterItems } = useTrashFilter();
  const { toolbarSortItems } = useTrashSort();
  const { toolbarActionItems } = useTrashActions();

  const filterContext = useMemo(() => {
    return {
      filtering,
      dialogs,
      listing,
    };
  }, [dialogs, filtering, listing]);

  const actionContext = useMemo(() => {
    return {
      listing,
      dialogs,
    };
  }, [dialogs, listing]);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-grow">
        {/* ソート */}
        <div className="w-full sm:w-[160px]">
          <SortDropdownMenu
            value={sort.value}
            onChange={sort.apply}
            items={toolbarSortItems}
          />
        </div>

        {/* フィルター */}
        <div className="w-full sm:w-[160px]">
          <FilterDropdownMenu
            menuItems={toolbarFilterItems}
            context={filterContext}
            onReset={filtering.reset}
            canReset={filtering.canReset}
          />
        </div>

        {/* アクション */}
        <div className="w-full sm:w-[160px]">
          <ActionDropdownMenu
            menuItems={toolbarActionItems}
            context={actionContext}
          />
        </div>
      </div>

      {/* 件数 */}
      <FilterResultText
        totalCount={filtering.totalCount}
        filteredCount={filtering.filteredCount}
        isFiltered={filtering.isFiltered}
        className="ml-auto min-w-[120px] text-right"
      />
    </div>
  );
}
