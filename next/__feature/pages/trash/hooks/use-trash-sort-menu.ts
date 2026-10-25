import {
  ALargeSmallIcon,
  CalendarIcon,
  ClockIcon,
  FileStackIcon,
  StarsIcon,
  WeightIcon,
} from "lucide-react";

const sortMenuItems = [
  {
    sort: "name",
    label: "名前",
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
    sort: "fileCount",
    label: "ファイル数",
    icon: FileStackIcon,
  },
  {
    sort: "lastViewed",
    label: "訪問日",
    icon: ClockIcon,
  },
  {
    sort: "rating",
    label: "評価",
    icon: StarsIcon,
  },
] as const;

export function useTrashSortMenu() {
  return { items: sortMenuItems };
}
