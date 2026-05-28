import { ResetButton } from "@/components/ui/buttons/reset-button";
import { FilterDropdownMenu } from "@/components/ui/dropdown-menus/filter-dropdown-menu";
import { SortDropdownMenu } from "@/components/ui/dropdown-menus/sort-dropdown-menu";
import { TrashDialogs } from "@/components/ui/pages/trash/hooks/use-trash-dialogs";
import { useTrashFilter } from "@/components/ui/pages/trash/hooks/use-trash-filter";
import { TrashFiltering } from "@/components/ui/pages/trash/hooks/use-trash-filtering";
import { useTrashSort } from "@/components/ui/pages/trash/hooks/use-trash-sort";
import { FilterResultText } from "@/components/ui/texts/filter-result-text";

interface TrashToolbarProps {
  filtering: TrashFiltering;
  dialogs: TrashDialogs;
}

export function TrashToolbar({ filtering, dialogs }: TrashToolbarProps) {
  const sort = useTrashSort();
  const filter = useTrashFilter({ filtering, dialogs });

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-grow">
        {/* ソート */}
        <div className="w-full sm:w-[160px]">
          <SortDropdownMenu
            value={sort.control.value}
            onChange={sort.control.apply}
            items={sort.options}
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
