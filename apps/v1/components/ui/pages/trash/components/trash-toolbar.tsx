import { ResetButton } from "@/components/ui/buttons/reset-button";
import { FilterDropdownMenu } from "@/components/ui/dropdown-menus/filter-dropdown-menu";
import { SortDropdownMenu } from "@/components/ui/dropdown-menus/sort-dropdown-menu";
import { TrashDialogs } from "@/components/ui/pages/trash/hooks/use-trash-dialogs";
import { useTrashFilter } from "@/components/ui/pages/trash/hooks/use-trash-filter";
import { TrashFiltering } from "@/components/ui/pages/trash/hooks/use-trash-filtering";
import { useTrashSort } from "@/components/ui/pages/trash/hooks/use-trash-sort";
import { FilterResultText } from "@/components/ui/texts/filter-result-text";
import { useSort } from "@/hooks/use-sort";
import { useMemo } from "react";

interface TrashToolbarProps {
  filtering: TrashFiltering;
  dialogs: TrashDialogs;
}

export function TrashToolbar({ filtering, dialogs }: TrashToolbarProps) {
  const sort = useSort();

  const { toolbarFilterItems } = useTrashFilter();
  const { toolbarSortItems } = useTrashSort();

  const filterContext = useMemo(() => {
    return {
      filtering,
      dialogs,
    };
  }, [dialogs, filtering]);

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
            items={toolbarFilterItems}
            context={filterContext}
          />
        </div>

        {/* リセット */}
        <ResetButton onClick={filtering.reset} isVisible={filtering.canReset} />
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
