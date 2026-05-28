import { useSort } from "@/hooks/use-sort";
import {
  ALargeSmallIcon,
  CalendarIcon,
  StarsIcon,
  WeightIcon,
} from "lucide-react";

export type FavoritesSort = ReturnType<typeof useFavoritesSort>;

export const options = [
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
  const control = useSort({});

  return { options, control };
}
