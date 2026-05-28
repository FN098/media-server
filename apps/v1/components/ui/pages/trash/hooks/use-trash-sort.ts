import { useSort } from "@/hooks/use-sort";
import {
  ALargeSmallIcon,
  CalendarIcon,
  ClockIcon,
  FileStackIcon,
  StarsIcon,
  WeightIcon,
} from "lucide-react";

export type TrashSort = ReturnType<typeof useTrashSort>;

export const options = [
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

export function useTrashSort() {
  const sort = useSort({});

  return {
    ...sort,
    options,
  };
}
