import { useSort } from "@/hooks/use-sort";
import {
  ArrowDownAzIcon,
  CalendarArrowDownIcon,
  ClockIcon,
  FileStackIcon,
  StarsIcon,
  WeightIcon,
} from "lucide-react";

export type ExplorerSort = ReturnType<typeof useExplorerSort>;

export const options = [
  {
    value: {
      sort: "name",
      direction: "asc",
    },
    label: "名前",
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
      sort: "fileCount",
      direction: "desc",
    },
    label: "ファイル数",
    icon: FileStackIcon,
  },
  {
    value: {
      sort: "lastViewed",
      direction: "desc",
    },
    label: "訪問日",
    icon: ClockIcon,
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

export function useExplorerSort() {
  const sort = useSort({});

  return {
    ...sort,
    options,
  };
}
