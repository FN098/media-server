import { ExplorerToolbarDialogs } from "@/components/ui/dialogs/explorer-dialogs";
import { ActionDropdownMenu } from "@/components/ui/dropdown-menus/action-dropdown-menu";
import { FilterDropdownMenu } from "@/components/ui/dropdown-menus/filter-dropdown-menu";
import { SortDropdownMenu } from "@/components/ui/dropdown-menus/sort-dropdown-menu";
import { FilterResultText } from "@/components/ui/texts/filter-result-text";
import { useExplorerActions } from "@/hooks/explorer/use-explorer-actions";
import { ExplorerDialogs } from "@/hooks/explorer/use-explorer-dialogs";
import { ExplorerFavorites } from "@/hooks/explorer/use-explorer-favorites";
import { useExplorerFilter } from "@/hooks/explorer/use-explorer-filter";
import { ExplorerFiltering } from "@/hooks/explorer/use-explorer-filtering";
import { useExplorerSort } from "@/hooks/explorer/use-explorer-sort";
import { MediaNodeSelection } from "@/hooks/selections/use-media-node-selection";
import { useSort } from "@/hooks/sort/use-sort";
import { MediaListing } from "@/lib/media/types";
import { useIsMobile } from "@/shadcn-overrides/hooks/use-mobile";
import { useMemo } from "react";

interface ExplorerToolbarProps {
  listing: MediaListing;
  filtering: ExplorerFiltering;
  dialogs: ExplorerDialogs;
  favorites: ExplorerFavorites;
  selection: MediaNodeSelection;
}

export function ExplorerToolbar({
  listing,
  filtering,
  dialogs,
  favorites,
  selection,
}: ExplorerToolbarProps) {
  const sort = useSort();

  const { toolbarFilterItems } = useExplorerFilter();
  const { toolbarSortItems } = useExplorerSort();
  const { toolbarActionItems } = useExplorerActions();

  const isMobile = useIsMobile();

  const filterContext = useMemo(() => {
    return {
      filtering,
      dialogs,
      listing,
    };
  }, [dialogs, filtering, listing]);

  const actionContext = useMemo(() => {
    const nonFavoriteTargets = filtering.filteredNodes.filter(
      (node) => !node.isDirectory && !favorites.get(node.path).isFavorite
    );

    return {
      listing,
      filtering,
      dialogs,
      favorites,
      selection,
      computed: {
        nonFavoriteTargets,
        hasNonFavoriteFiles: nonFavoriteTargets.length > 0,
        isMobile,
      },
    };
  }, [filtering, listing, dialogs, favorites, selection, isMobile]);

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
        className="ml-auto sm:ml-auto min-w-[120px] text-right pt-2 sm:pt-0"
      />

      {/* ダイアログ */}
      <ExplorerToolbarDialogs dialogs={dialogs} />
    </div>
  );
}
