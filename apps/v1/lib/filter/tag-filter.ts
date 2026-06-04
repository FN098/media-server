import { FilterMenuItem } from "@/lib/menu-items/types";
import { TagIcon } from "lucide-react";

export interface TagFilterMenuContext {
  hasTagFilter: boolean;
  openTagFilter(): void;
}

export const tagFilterMenuItems: FilterMenuItem<TagFilterMenuContext>[] = [
  {
    key: "tag-filter",
    type: "action",
    label: "タグ",
    icon: TagIcon,
    isActive: (ctx) => ctx.hasTagFilter,
    onClick: (ctx) => ctx.openTagFilter(),
  },
];
