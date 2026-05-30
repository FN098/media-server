import { ActionDropdownMenu } from "@/components/ui/dropdown-menus/action-dropdown-menu";
import { FilterDropdownMenu } from "@/components/ui/dropdown-menus/filter-dropdown-menu";
import { SortDropdownMenu } from "@/components/ui/dropdown-menus/sort-dropdown-menu";
import { useTrashActions } from "@/components/ui/pages/trash/hooks/use-trash-actions";
import { TrashDialogs } from "@/components/ui/pages/trash/hooks/use-trash-dialogs";
import { useTrashFilter } from "@/components/ui/pages/trash/hooks/use-trash-filter";
import { TrashFiltering } from "@/components/ui/pages/trash/hooks/use-trash-filtering";
import { useTrashSort } from "@/components/ui/pages/trash/hooks/use-trash-sort";
import { FilterResultText } from "@/components/ui/texts/filter-result-text";
import { useSort } from "@/hooks/use-sort";
import { MediaListing } from "@/lib/media/types";
import { useMemo } from "react";

interface TrashToolbarProps {
  listing: MediaListing;
  filtering: TrashFiltering;
  dialogs: TrashDialogs;
}

export function TrashToolbar({
  listing,
  filtering,
  dialogs,
}: TrashToolbarProps) {
  const sort = useSort();

  const { toolbarFilterItems } = useTrashFilter();
  const { toolbarSortItems } = useTrashSort();
  const { toolbarActionItems } = useTrashActions();

  const filterContext = useMemo(() => {
    return {
      filtering,
      dialogs,
    };
  }, [dialogs, filtering]);

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
