import { ShuffleButton } from "@/components/ui/buttons/shuffle-button";
import { FilterDropdownMenu } from "@/components/ui/dropdown-menus/filter-dropdown-menu";
import { SortDropdownMenu } from "@/components/ui/dropdown-menus/sort-dropdown-menu";
import { FavoritesToolbarDialogs } from "@/components/ui/pages/favorites/components/favorites-dialogs";
import { FavoritesDialogs } from "@/components/ui/pages/favorites/hooks/use-favorites-dialogs";
import { useFavoritesFilter } from "@/components/ui/pages/favorites/hooks/use-favorites-filter";
import { FavoritesFiltering } from "@/components/ui/pages/favorites/hooks/use-favorites-filtering";
import { useFavoritesSort } from "@/components/ui/pages/favorites/hooks/use-favorites-sort";
import { FilterResultText } from "@/components/ui/texts/filter-result-text";
import { useSort } from "@/hooks/use-sort";
import { useMemo } from "react";

interface FavoritesToolbarProps {
  filtering: FavoritesFiltering;
  dialogs: FavoritesDialogs;
}

export function FavoritesToolbar({
  filtering,
  dialogs,
}: FavoritesToolbarProps) {
  const sort = useSort();

  const { toolbarFilterItems } = useFavoritesFilter();
  const { toolbarSortItems } = useFavoritesSort();

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

      {/* ダイアログ */}
      <FavoritesToolbarDialogs dialogs={dialogs} filtering={filtering} />
    </div>
  );
}
