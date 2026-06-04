import { MediaType } from "@/generated/prisma/enums";
import { FilterMenuItem } from "@/lib/menu-items/types";
import { FileTypeIcon, ImageIcon, MusicIcon, VideoIcon } from "lucide-react";

export interface FileTypeFilterMenuContext {
  mediaTypes: MediaType[];
  toggleMediaType(type: MediaType): void;
}

export const fileTypeFilterMenuItems: FilterMenuItem<FileTypeFilterMenuContext>[] =
  [
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
  ];
