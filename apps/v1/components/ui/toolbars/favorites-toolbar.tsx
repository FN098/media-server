import { ShuffleButton } from "@/components/ui/buttons/shuffle-button";
import { ActionDropdownMenu } from "@/components/ui/dropdown-menus/action-dropdown-menu";
import { FilterDropdownMenu } from "@/components/ui/dropdown-menus/filter-dropdown-menu";
import { SortDropdownMenu } from "@/components/ui/dropdown-menus/sort-dropdown-menu";
import { FilterResultText } from "@/components/ui/texts/filter-result-text";
import { useFavoritesActionMenu } from "@/hooks/favorites/use-favorites-action-menu";
import { useFavoritesFilterMenu } from "@/hooks/favorites/use-favorites-filter-menu";
import { useFavoritesSortMenu } from "@/hooks/favorites/use-favorites-sort-menu";
import { useFavoritesContext } from "@/providers/favorites-provider";

export function FavoritesToolbar() {
  const { filtering, sort } = useFavoritesContext();

  const filterMenu = useFavoritesFilterMenu();
  const sortMenu = useFavoritesSortMenu();
  const actionMenu = useFavoritesActionMenu();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-grow">
        {/* ソート */}
        {sortMenu.items.length > 0 && (
          <div className="w-full sm:w-[160px]">
            <SortDropdownMenu
              items={sortMenu.items}
              value={sort.value}
              onChange={sort.apply}
            />
          </div>
        )}

        {/* フィルター */}
        {filterMenu.items.length > 0 && (
          <div className="w-full sm:w-[160px]">
            <FilterDropdownMenu
              items={filterMenu.items}
              context={filterMenu.context}
              onReset={filtering.reset}
              canReset={filtering.canReset}
            />
          </div>
        )}

        {/* アクション */}
        {actionMenu.items.length > 0 && (
          <div className="w-full sm:w-[160px]">
            <ActionDropdownMenu
              items={actionMenu.items}
              context={actionMenu.context}
            />
          </div>
        )}

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
