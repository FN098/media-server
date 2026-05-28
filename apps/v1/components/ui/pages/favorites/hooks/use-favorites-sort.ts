import {
  ALargeSmallIcon,
  CalendarIcon,
  StarsIcon,
  WeightIcon,
} from "lucide-react";

export type FavoritesSort = ReturnType<typeof useFavoritesSort>;

export const toolbarSortItems = [
  {
    sort: "path",
    label: "ファイルパス",
    icon: ALargeSmallIcon,
  },
  {
    sort: "mtime",
    label: "更新日",
    icon: CalendarIcon,
  },
  {
    sort: "size",
    label: "サイズ",
    icon: WeightIcon,
  },
  {
    sort: "rating",
    label: "評価",
    icon: StarsIcon,
  },
] as const;

export function useFavoritesSort() {
  return { toolbarSortItems };
}
