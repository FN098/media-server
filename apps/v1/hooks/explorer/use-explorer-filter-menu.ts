import { ExplorerDialogs } from "@/hooks/explorer/use-explorer-dialogs";
import { ExplorerFiltering } from "@/hooks/explorer/use-explorer-filtering";
import { MediaListing } from "@/lib/media/types";
import { defaultFilters } from "@/lib/menu-items/filters";
import { createRecursiveTransformer } from "@/lib/menu-items/transformer";
import { FilterMenuItem, MenuItemDef } from "@/lib/menu-items/types";
import { useExplorerContext } from "@/providers/explorer-provider";
import {
  FileTypeIcon,
  ImageIcon,
  MusicIcon,
  StarIcon,
  StarsIcon,
  TagIcon,
  VideoIcon,
} from "lucide-react";
import { useMemo } from "react";

interface ExplorerFilterMenuContext {
  filtering: ExplorerFiltering;
  dialogs: ExplorerDialogs;
  listing: MediaListing;
}

const filterMenuItems: FilterMenuItem<ExplorerFilterMenuContext>[] = [
  {
    key: "favorite-filter-group",
    type: "group",
    label: "お気に入り",
    icon: StarIcon,
    isActive: (ctx) => ctx.filtering.controls.favorite.value.mode === "all",
    children: [
      {
        key: "favorite-only",
        type: "action",
        label: "お気に入りのみ",
        icon: StarIcon,
        iconClassName: "fill-yellow-400 text-yellow-400",
        isActive: (ctx) =>
          ctx.filtering.controls.favorite.value.mode === "only_favorites",
        onClick: (ctx) => {
          const nextMode =
            ctx.filtering.controls.favorite.value.mode === "only_favorites"
              ? "all"
              : "only_favorites";
          ctx.filtering.controls.favorite.apply({ mode: nextMode });
        },
      },
      {
        key: "nonfavorite-only",
        type: "action",
        label: "お気に入り以外",
        icon: StarIcon,
        iconClassName: "text-muted-foreground",
        isActive: (ctx) =>
          ctx.filtering.controls.favorite.value.mode === "exclude_favorites",
        onClick: (ctx) => {
          const nextMode =
            ctx.filtering.controls.favorite.value.mode === "exclude_favorites"
              ? "all"
              : "exclude_favorites";
          ctx.filtering.controls.favorite.apply({ mode: nextMode });
        },
      },
    ],
  },
  {
    key: "file-type-filter-group",
    type: "group",
    label: "種別",
    icon: FileTypeIcon,
    isActive: (ctx) => ctx.filtering.controls.mediaType.value.types.length > 0,
    children: [
      {
        key: "file-type-filter-image",
        type: "action",
        label: "画像",
        icon: ImageIcon,
        isActive: (ctx) =>
          ctx.filtering.controls.mediaType.value.types.includes("image"),
        onClick: (ctx) => {
          if (ctx.filtering.controls.mediaType.value.types.includes("image")) {
            ctx.filtering.controls.mediaType.reset();
          } else {
            ctx.filtering.controls.mediaType.apply({ types: ["image"] });
          }
        },
      },
      {
        key: "file-type-filter-video",
        type: "action",
        label: "動画",
        icon: VideoIcon,
        isActive: (ctx) =>
          ctx.filtering.controls.mediaType.value.types.includes("video"),
        onClick: (ctx) => {
          if (ctx.filtering.controls.mediaType.value.types.includes("video")) {
            ctx.filtering.controls.mediaType.reset();
          } else {
            ctx.filtering.controls.mediaType.apply({ types: ["video"] });
          }
        },
      },
      {
        key: "file-type-filter-audio",
        type: "action",
        label: "音声",
        icon: MusicIcon,
        isActive: (ctx) =>
          ctx.filtering.controls.mediaType.value.types.includes("audio"),
        onClick: (ctx) => {
          if (ctx.filtering.controls.mediaType.value.types.includes("audio")) {
            ctx.filtering.controls.mediaType.reset();
          } else {
            ctx.filtering.controls.mediaType.apply({ types: ["audio"] });
          }
        },
      },
    ],
  },
  {
    key: "rating-filter",
    type: "action",
    label: "評価",
    icon: StarsIcon,
    isActive: (ctx) => ctx.filtering.controls.rating.value.mode !== "all",
    onClick: (ctx) => {
      ctx.dialogs.ratingFilterDialog.open(ctx.filtering.controls.rating.value);
    },
  },
  {
    key: "tag-filter",
    type: "action",
    label: "タグ",
    icon: TagIcon,
    isActive: (ctx) => ctx.filtering.controls.tag.value.tags.length > 0,
    onClick: (ctx) => {
      ctx.dialogs.tagFilterDialog.open(
        ctx.filtering.controls.tag.value,
        ctx.listing.nodes
      );
    },
  },
];

const transformer = createRecursiveTransformer<
  MenuItemDef<ExplorerFilterMenuContext>,
  ExplorerFilterMenuContext
>(defaultFilters);

export function useExplorerFilterMenu() {
  const { listing, filtering, dialogs } = useExplorerContext();

  const context = useMemo(() => {
    return {
      filtering,
      dialogs,
      listing,
    };
  }, [dialogs, filtering, listing]);

  const transformed = useMemo(
    () => transformer(filterMenuItems, context),
    [context]
  );

  return {
    items: transformed,
    context,
  };
}
