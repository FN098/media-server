import { FilterMenuItem } from "@/components/ui/dropdown-menus/filter-dropwodn-menu";
import { ExplorerDialogs } from "@/components/ui/pages/explorer/hooks/use-explorer-dialogs";
import { ExplorerFiltering } from "@/components/ui/pages/explorer/hooks/use-explorer-filtering";
import {
  ImageIcon,
  Layers,
  MusicIcon,
  StarIcon,
  StarsIcon,
  TagIcon,
  VideoIcon,
} from "lucide-react";

export type ExplorerFilterMenu = ReturnType<typeof useExplorerFilterMenu>;

interface UseExplorerFilterMenuProps {
  filtering: ExplorerFiltering;
  dialogs: ExplorerDialogs;
}

export function useExplorerFilterMenu({
  filtering,
  dialogs,
}: UseExplorerFilterMenuProps) {
  const favValue = filtering.controls.favorite.value.mode;

  const mediaTypeValue = filtering.controls.mediaType.value;

  const ratingValue = filtering.controls.rating.value;
  const isRatingActive = ratingValue.mode !== "all";

  const tagValue = filtering.controls.tag.value;
  const isTagActive = tagValue.tags && tagValue.tags.length > 0;

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
            if (mediaTypeValue.types.includes("image")) {
              filtering.controls.mediaType.reset();
            } else {
              filtering.controls.mediaType.apply({ types: ["image"] });
            }
          },
        },
        {
          type: "action",
          label: "動画",
          icon: VideoIcon,
          isActive: mediaTypeValue.types.includes("video"),
          onClick: () => {
            if (mediaTypeValue.types.includes("video")) {
              filtering.controls.mediaType.reset();
            } else {
              filtering.controls.mediaType.apply({ types: ["video"] });
            }
          },
        },
        {
          type: "action",
          label: "音声",
          icon: MusicIcon,
          isActive: mediaTypeValue.types.includes("audio"),
          onClick: () => {
            if (mediaTypeValue.types.includes("audio")) {
              filtering.controls.mediaType.reset();
            } else {
              filtering.controls.mediaType.apply({ types: ["audio"] });
            }
          },
        },
      ],
    },
    {
      type: "action",
      label: "評価...",
      icon: StarsIcon,
      isActive: isRatingActive,
      onClick: () => {
        dialogs.ratingFilterDialog.open(filtering.controls.rating.value);
      },
    },
    {
      type: "action",
      label: "タグ...",
      icon: TagIcon,
      isActive: isTagActive,
      onClick: () => {
        dialogs.tagFilterDialog.open(filtering.controls.tag.value);
      },
    },
  ];

  return {
    menuItems: filterMenuItems,
  };
}
