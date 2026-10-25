import { useFavoritesActionMenu } from "@/__feature/pages/favorites/hooks/use-favorites-action-menu";
import { useFavoritesFilterMenu } from "@/__feature/pages/favorites/hooks/use-favorites-filter-menu";
import { useFavoritesSortMenu } from "@/__feature/pages/favorites/hooks/use-favorites-sort-menu";
import { useFavoritesContext } from "@/__feature/pages/favorites/providers/favorites-provider";
import { ShuffleButton } from "@/__feature/shuffle/ui/shuffle-button";
import { FilterResultText } from "@/__feature/text/ui/filter-result-text";
import { ActionDropdownMenu } from "@/__feature/toolbar-menu/ui/action-dropdown-menu";
import { FilterDropdownMenu } from "@/__feature/toolbar-menu/ui/filter-dropdown-menu";
import { SortDropdownMenu } from "@/__feature/toolbar-menu/ui/sort-dropdown-menu";

export function FavoritesToolbar() {
  const { filtering, sort } = useFavoritesContext();

  const filterMenu = useFavoritesFilterMenu();
  const sortMenu = useFavoritesSortMenu();
  const actionMenu = useFavoritesActionMenu();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-grow">
        {sortMenu.items.length > 0 && (
          <div className="w-full sm:w-[160px]">
            <SortDropdownMenu
              items={sortMenu.items}
              value={sort.value}
              onChange={sort.apply}
            />
          </div>
        )}

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

        {actionMenu.items.length > 0 && (
          <div className="w-full sm:w-[160px]">
            <ActionDropdownMenu
              items={actionMenu.items}
              context={actionMenu.context}
            />
          </div>
        )}

        <ShuffleButton />
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
