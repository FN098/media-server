import { FilterMenuItem } from "@/components/ui/dropdown-menus/filter-dropdown-menu";
import { FavoritesDialogs } from "@/components/ui/pages/favorites/hooks/use-favorites-dialogs";
import { FavoritesFiltering } from "@/components/ui/pages/favorites/hooks/use-favorites-filtering";
import {
  ImageIcon,
  Layers,
  MusicIcon,
  StarsIcon,
  TagIcon,
  VideoIcon,
} from "lucide-react";
import { useMemo } from "react";

export type FavoritesFilter = ReturnType<typeof useFavoritesFilter>;

interface UseFavoritesFilterProps {
  filtering: FavoritesFiltering;
  dialogs: FavoritesDialogs;
}

export function useFavoritesFilter({
  filtering,
  dialogs,
}: UseFavoritesFilterProps) {
  const mediaTypeValue = filtering.controls.mediaType.value;

  const ratingValue = filtering.controls.rating.value;
  const isRatingActive = ratingValue.mode !== "all";

  const tagValue = filtering.controls.tag.value;
  const isTagActive = tagValue.tags && tagValue.tags.length > 0;

  const menuItems = useMemo(
    () =>
      [
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
      ] satisfies FilterMenuItem[],
    [
      dialogs.ratingFilterDialog,
      dialogs.tagFilterDialog,
      filtering.controls.mediaType,
      filtering.controls.rating.value,
      filtering.controls.tag.value,
      isRatingActive,
      isTagActive,
      mediaTypeValue.types,
    ]
  );

  return { menuItems, control: filtering };
}
