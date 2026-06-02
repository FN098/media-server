import { FavoritesDialogs } from "@/hooks/favorites/use-favorites-dialogs";
import { FavoritesFiltering } from "@/hooks/favorites/use-favorites-filtering";
import { MediaListing } from "@/lib/media/types";
import { FilterMenuItem } from "@/lib/menu-items/types";
import {
  FileTypeIcon,
  ImageIcon,
  MusicIcon,
  StarsIcon,
  TagIcon,
  VideoIcon,
} from "lucide-react";

interface FavoritesFilterMenuContext {
  filtering: FavoritesFiltering;
  dialogs: FavoritesDialogs;
  listing: MediaListing;
}

const filterMenuItems: FilterMenuItem<FavoritesFilterMenuContext>[] = [
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

export function useFavoritesFilterMenu() {
  return { items: filterMenuItems };
}
