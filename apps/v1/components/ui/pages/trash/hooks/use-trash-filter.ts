import { FilterMenuItem } from "@/components/ui/dropdown-menus/filter-dropdown-menu";
import { TrashDialogs } from "@/components/ui/pages/trash/hooks/use-trash-dialogs";
import { TrashFiltering } from "@/components/ui/pages/trash/hooks/use-trash-filtering";
import { ImageIcon, Layers, MusicIcon, TagIcon, VideoIcon } from "lucide-react";
import { useMemo } from "react";

export type TrashFilter = ReturnType<typeof useTrashFilter>;

interface UseTrashFilterProps {
  filtering: TrashFiltering;
  dialogs: TrashDialogs;
}

export function useTrashFilter({ filtering, dialogs }: UseTrashFilterProps) {
  const mediaTypeValue = filtering.controls.mediaType.value;

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
          label: "タグ...",
          icon: TagIcon,
          isActive: isTagActive,
          onClick: () => {
            dialogs.tagFilterDialog.open(filtering.controls.tag.value);
          },
        },
      ] satisfies FilterMenuItem[],
    [
      dialogs.tagFilterDialog,
      filtering.controls.mediaType,
      filtering.controls.tag.value,
      isTagActive,
      mediaTypeValue.types,
    ]
  );

  return { menuItems, control: filtering };
}
