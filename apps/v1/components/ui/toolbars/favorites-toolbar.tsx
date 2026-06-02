import { ShuffleButton } from "@/components/ui/buttons/shuffle-button";
import { FilterDropdownMenu } from "@/components/ui/dropdown-menus/filter-dropdown-menu";
import { SortDropdownMenu } from "@/components/ui/dropdown-menus/sort-dropdown-menu";
import { FilterResultText } from "@/components/ui/texts/filter-result-text";
import { useFavoritesFilter } from "@/hooks/favorites/use-favorites-filter";
import { useFavoritesSort } from "@/hooks/favorites/use-favorites-sort";
import { useSort } from "@/hooks/sort/use-sort";
import { useFavoritesContext } from "@/providers/favorites-provider";
import { useMemo } from "react";

export function FavoritesToolbar() {
  const { listing, filtering, dialogs } = useFavoritesContext();

  const sort = useSort();

  const { toolbarFilterItems } = useFavoritesFilter();
  const { toolbarSortItems } = useFavoritesSort();

  const filterContext = useMemo(() => {
    return {
      filtering,
      dialogs,
      listing,
    };
  }, [dialogs, filtering, listing]);

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

        {/* シャッフルボタン */}
        <ShuffleButton />
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
