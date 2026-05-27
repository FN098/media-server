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
    value: {
      sort: "path",
      direction: "asc",
    },
    label: "ファイルパス",
    icon: ArrowDownAzIcon,
  },
  {
    value: {
      sort: "mtime",
      direction: "desc",
    },
    label: "更新日",
    icon: CalendarArrowDownIcon,
  },
  {
    value: {
      sort: "size",
      direction: "desc",
    },
    label: "サイズ",
    icon: WeightIcon,
  },
  {
    value: {
      sort: "rating",
      direction: "desc",
    },
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
