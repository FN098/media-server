import { ResetButton } from "@/components/ui/buttons/reset-button";
import { TagFilterDialog } from "@/components/ui/dialogs/tag-filter-dialog";
import { TrashFiltering } from "@/components/ui/pages/trash/hooks/use-trash-filtering";
import { TrashSort } from "@/components/ui/pages/trash/hooks/use-trash-sort";
import { MediaTypeFilterMultiSelect } from "@/components/ui/selects/media-type-filter-multi-select";
import { SortSelect } from "@/components/ui/selects/sort-select";
import { FilterResultText } from "@/components/ui/texts/filter-result-text";
import { useIsMobile } from "@/shadcn/hooks/use-mobile";

interface TrashToolbarProps {
  sort: TrashSort;
  filtering: TrashFiltering;
}

export function TrashToolbar({ sort, filtering }: TrashToolbarProps) {
  const isMobile = useIsMobile();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-2">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-2 flex-grow">
        {/* 並び替え */}
        <SortSelect
          value={sort.value}
          onChange={sort.apply}
          options={sort.options}
        />

        {/* 種別フィルター */}
        <MediaTypeFilterMultiSelect
          value={filtering.controls.mediaType.value}
          onChange={filtering.controls.mediaType.apply}
          displayTypes={["image", "video", "audio"]}
        />

        {/* タグフィルター */}
        <TagFilterDialog
          value={filtering.controls.tag.value}
          onChange={filtering.controls.tag.apply}
          relatedNodes={filtering.mediaOnly}
          autoFocusInput={!isMobile}
        />

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
