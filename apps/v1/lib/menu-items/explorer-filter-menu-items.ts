import { MediaType } from "@/generated/prisma/enums";
import { FavoriteFilterMode } from "@/lib/filter/types";
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

export interface ExplorerFilterMenuContext {
  favoriteFilterMode: FavoriteFilterMode;
  mediaTypes: MediaType[];
  hasRatingFilter: boolean;
  hasTagFilter: boolean;
  toggleFavoriteOnly(): void;
  toggleNonFavoriteOnly(): void;
  toggleMediaType(type: MediaType): void;
  openRatingFilter(): void;
  openTagFilter(): void;
}

export const explorerFilterMenuItems: FilterMenuItem<ExplorerFilterMenuContext>[] =
  [
    {
      key: "favorite-filter-group",
      type: "group",
      label: "お気に入り",
      icon: StarIcon,
      isActive: (ctx) =>
        ["only_favorites", "exclude_favorites"].includes(
          ctx.favoriteFilterMode
        ),
      children: [
        {
          key: "favorite-only",
          type: "action",
          label: "お気に入りのみ",
          icon: StarIcon,
          iconClassName: "fill-yellow-400 text-yellow-400",
          isActive: (ctx) => ctx.favoriteFilterMode === "only_favorites",
          onClick: (ctx) => ctx.toggleFavoriteOnly(),
        },
        {
          key: "nonfavorite-only",
          type: "action",
          label: "お気に入り以外",
          icon: StarIcon,
          iconClassName: "text-muted-foreground",
          isActive: (ctx) => ctx.favoriteFilterMode === "exclude_favorites",
          onClick: (ctx) => ctx.toggleNonFavoriteOnly(),
        },
      ],
    },
    {
      key: "file-type-filter-group",
      type: "group",
      label: "種別",
      icon: FileTypeIcon,
      isActive: (ctx) => ctx.mediaTypes.length > 0,
      children: [
        {
          key: "file-type-filter-image",
          type: "action",
          label: "画像",
          icon: ImageIcon,
          isActive: (ctx) => ctx.mediaTypes.includes("image"),
          onClick: (ctx) => ctx.toggleMediaType("image"),
        },
        {
          key: "file-type-filter-video",
          type: "action",
          label: "動画",
          icon: VideoIcon,
          isActive: (ctx) => ctx.mediaTypes.includes("video"),
          onClick: (ctx) => ctx.toggleMediaType("video"),
        },
        {
          key: "file-type-filter-audio",
          type: "action",
          label: "音声",
          icon: MusicIcon,
          isActive: (ctx) => ctx.mediaTypes.includes("audio"),
          onClick: (ctx) => ctx.toggleMediaType("audio"),
        },
      ],
    },
    {
      key: "rating-filter",
      type: "action",
      label: "評価",
      icon: StarsIcon,
      isActive: (ctx) => ctx.hasRatingFilter,
      onClick: (ctx) => ctx.openRatingFilter(),
    },
    {
      key: "tag-filter",
      type: "action",
      label: "タグ",
      icon: TagIcon,
      isActive: (ctx) => ctx.hasTagFilter,
      onClick: (ctx) => ctx.openTagFilter(),
    },
  ];
