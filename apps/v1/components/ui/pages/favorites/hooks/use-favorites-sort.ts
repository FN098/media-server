import { useSort } from "@/hooks/use-sort";
import {
  ArrowDownAzIcon,
  CalendarArrowDownIcon,
  StarsIcon,
  WeightIcon,
} from "lucide-react";

export type FavoritesSort = ReturnType<typeof useFavoritesSort>;

export const options = [
  {
    sort: "path",
    label: "ファイルパス",
    icon: ArrowDownAzIcon,
  },
  {
    sort: "mtime",
    label: "更新日",
    icon: CalendarArrowDownIcon,
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
  const sort = useSort({});

  return {
    ...sort,
    options,
  };
}
