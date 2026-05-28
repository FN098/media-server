import { ActionDropdownMenu } from "@/components/ui/dropdown-menus/action-dropdown-menu";
import { FilterDropdownMenu } from "@/components/ui/dropdown-menus/filter-dropdown-menu";
import { SortDropdownMenu } from "@/components/ui/dropdown-menus/sort-dropdown-menu";
import { ExplorerToolbarDialogs } from "@/components/ui/pages/explorer/components/explorer-dialogs";
import { useExplorerActions } from "@/components/ui/pages/explorer/hooks/use-explorer-actions";
import { ExplorerDialogs } from "@/components/ui/pages/explorer/hooks/use-explorer-dialogs";
import { ExplorerFavorites } from "@/components/ui/pages/explorer/hooks/use-explorer-favorites";
import { useExplorerFilter } from "@/components/ui/pages/explorer/hooks/use-explorer-filter";
import { ExplorerFiltering } from "@/components/ui/pages/explorer/hooks/use-explorer-filtering";
import { useExplorerSort } from "@/components/ui/pages/explorer/hooks/use-explorer-sort";
import { FilterResultText } from "@/components/ui/texts/filter-result-text";
import { useSort } from "@/hooks/use-sort";
import { MediaListing } from "@/lib/media/types";
import { useMemo } from "react";

interface ExplorerToolbarProps {
  listing: MediaListing;
  filtering: ExplorerFiltering;
  dialogs: ExplorerDialogs;
  favorites: ExplorerFavorites;
}

export function ExplorerToolbar({
  listing,
  filtering,
  dialogs,
  favorites,
}: ExplorerToolbarProps) {
  const sort = useSort();

  const { toolbarFilterItems } = useExplorerFilter();
  const { toolbarSortItems } = useExplorerSort();
  const { toolbarActionItems } = useExplorerActions();

  const filterContext = useMemo(() => {
    return {
      filtering,
      dialogs,
    };
  }, [dialogs, filtering]);

  const actionContext = useMemo(() => {
    const nonFavoriteTargets = filtering.filteredNodes.filter(
      (node) => !node.isDirectory && !favorites.get(node.path).isFavorite
    );

    return {
      listing,
      filtering,
      dialogs,
      favorites,
      computed: {
        nonFavoriteTargets,
        hasNonFavoriteFiles: nonFavoriteTargets.length > 0,
      },
    };
  }, [listing, filtering, dialogs, favorites]);

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

        {/* アクション */}
        <div className="w-full sm:w-[160px]">
          <ActionDropdownMenu
            items={toolbarActionItems}
            context={actionContext}
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

      {/* ダイアログ */}
      <ExplorerToolbarDialogs dialogs={dialogs} filtering={filtering} />
    </div>
  );
}
