import { TrashDialogs } from "@/hooks/trash/use-trash-dialogs";
import { TrashFiltering } from "@/hooks/trash/use-trash-filtering";
import { MediaListing } from "@/lib/media/types";
import { FilterMenuItem } from "@/lib/menu-items/types";
import {
  FileTypeIcon,
  ImageIcon,
  MusicIcon,
  StarIcon,
  StarsIcon,
  TagIcon,
  VideoIcon,
} from "lucide-react";

interface TrashToolbarFilterContext {
  filtering: TrashFiltering;
  dialogs: TrashDialogs;
  listing: MediaListing;
}

const toolbarFilterItems: FilterMenuItem<TrashToolbarFilterContext>[] = [
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

export function useTrashFilter() {
  return { toolbarFilterItems };
}
