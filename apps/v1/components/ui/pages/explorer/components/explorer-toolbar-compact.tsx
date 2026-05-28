import { ResetButton } from "@/components/ui/buttons/reset-button";
import { RatingFilterDialog } from "@/components/ui/dialogs/rating-filter-dialog";
import { TagFilterDialog } from "@/components/ui/dialogs/tag-filter-dialog";
import {
  FilterDropdownMenu,
  FilterMenuItem,
} from "@/components/ui/dropdown-menus/filter-dropwodn-menu";
import { SortDropdownMenu } from "@/components/ui/dropdown-menus/sort-dropdown-menu";
import { ExplorerDialogs } from "@/components/ui/pages/explorer/hooks/use-explorer-dialogs";
import { ExplorerFavorites } from "@/components/ui/pages/explorer/hooks/use-explorer-favorites";
import { ExplorerFiltering } from "@/components/ui/pages/explorer/hooks/use-explorer-filtering";
import { ExplorerSort } from "@/components/ui/pages/explorer/hooks/use-explorer-sort";
import { FavoriteFilterSelect } from "@/components/ui/selects/favorite-filter-select";
import { MediaTypeFilterMultiSelect } from "@/components/ui/selects/media-type-filter-multi-select";
import { FilterResultText } from "@/components/ui/texts/filter-result-text";
import { MediaListing } from "@/lib/media/types";
import { Button } from "@/shadcn/components/ui/button";
import { useIsMobile } from "@/shadcn/hooks/use-mobile";
import {
  FolderPlus,
  ImageIcon,
  Layers,
  MusicIcon,
  StarIcon,
  TrashIcon,
  VideoIcon,
} from "lucide-react";

interface ExplorerToolbarProps {
  listing: MediaListing;
  sort: ExplorerSort;
  filtering: ExplorerFiltering;
  dialogs: ExplorerDialogs;
  favorites: ExplorerFavorites;
}

export function ExplorerToolbar({
  listing,
  sort,
  filtering,
  dialogs,
  favorites,
}: ExplorerToolbarProps) {
  const isMobile = useIsMobile();

  const favValue = filtering.controls.favorite.value.mode;
  const mediaTypeValue = filtering.controls.mediaType.value;

  const filterMenuItems: FilterMenuItem[] = [
    {
      type: "group",
      label: "お気に入り",
      icon: StarIcon,
      isActive: favValue !== "all", // 何かしら選択されていればグループ自体を光らせる
      children: [
        {
          type: "action",
          label: "お気に入りのみ",
          icon: StarIcon,
          iconClassName: "fill-yellow-400 text-yellow-400",
          isActive: favValue === "only_favorites",
          onClick: () => {
            const nextMode =
              favValue === "only_favorites" ? "all" : "only_favorites";
            filtering.controls.favorite.apply({ mode: nextMode });
          },
        },
        {
          type: "action",
          label: "お気に入り以外",
          icon: StarIcon,
          iconClassName: "text-muted-foreground",
          isActive: favValue === "exclude_favorites",
          onClick: () => {
            const nextMode =
              favValue === "exclude_favorites" ? "all" : "exclude_favorites";
            filtering.controls.favorite.apply({ mode: nextMode });
          },
        },
      ],
    },
    {
      type: "group",
      label: "種別",
      icon: Layers,
      isActive: mediaTypeValue.types.length > 0,
      children: [
        {
          type: "action",
          label: "画像",
          icon: ImageIcon,
          isActive: mediaTypeValue.types.includes("image"),
          onClick: () => {
            filtering.controls.mediaType.apply({ types: ["image"] });
          },
        },
        {
          type: "action",
          label: "動画",
          icon: VideoIcon,
          isActive: mediaTypeValue.types.includes("video"),
          onClick: () => {
            filtering.controls.mediaType.apply({ types: ["video"] });
          },
        },
        {
          type: "action",
          label: "音声",
          icon: MusicIcon,
          isActive: mediaTypeValue.types.includes("audio"),
          onClick: () => {
            filtering.controls.mediaType.apply({ types: ["audio"] });
          },
        },
      ],
    },
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-2">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-2 flex-grow">
        {/* 並び替え */}
        <SortDropdownMenu
          value={sort.value}
          onChange={sort.apply}
          options={sort.options}
        />

        <FilterDropdownMenu
          items={filterMenuItems}
          onReset={filtering.reset}
          canReset={filtering.canReset}
        />

        {/* お気に入りフィルター */}
        <FavoriteFilterSelect
          value={filtering.controls.favorite.value}
          onChange={filtering.controls.favorite.apply}
        />

        {/* 種別フィルター */}
        <MediaTypeFilterMultiSelect
          value={filtering.controls.mediaType.value}
          onChange={filtering.controls.mediaType.apply}
          displayTypes={["image", "video", "audio"]}
        />

        {/* 評価フィルター */}
        <RatingFilterDialog
          value={filtering.controls.rating.value}
          onChange={filtering.controls.rating.apply}
        />

        {/* タグフィルター */}
        <TagFilterDialog
          value={filtering.controls.tag.value}
          onChange={filtering.controls.tag.apply}
          relatedNodes={filtering.mediaOnly}
          autoFocusInput={!isMobile}
        />

        {/* 新規フォルダ */}
        <Button
          variant="outline"
          onClick={() => dialogs.createFolderDialog.open(listing.path)}
        >
          <FolderPlus className="h-4 w-4" />
          新規フォルダ
        </Button>

        {/* お気に入り以外一括削除 */}
        <Button
          variant="outline"
          onClick={() => {
            // ファイルかつお気に入りでないものを抽出
            const targets = filtering.filteredNodes.filter(
              (node) =>
                !node.isDirectory && !favorites.get(node.path).isFavorite
            );
            if (targets.length > 0) {
              dialogs.deleteDialog.open(targets);
            }
          }}
        >
          <TrashIcon className="h-4 w-4" />
          お気に入り以外一括削除
        </Button>

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
