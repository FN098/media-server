"use client";

import { useSort } from "@/hooks/use-sort";
import { usePagingContext } from "@/providers/paging-provider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/components/ui/select";
import { cn } from "@/shadcn/lib/utils";
import { ArrowUpDown, LucideIcon } from "lucide-react";

export interface SortOption {
  key: string;
  direction: "asc" | "desc";
  label: string;
  icon?: LucideIcon;
}

interface SortSelectProps {
  options: SortOption[];
  placeholder?: string;
  emptyLabel?: string;
  onChange?: (key: string | null, dir: string | null) => void;
}

export function SortSelect({
  options,
  placeholder = "並び替え",
  emptyLabel = "ソートなし",
  onChange,
}: SortSelectProps) {
  const { sort, direction, setSort, isPending } = useSort();
  const { setPage } = usePagingContext();

  const selectValue = sort && direction ? `${sort}-${direction}` : "none";

  const handleValueChange = (value: string) => {
    let newKey: string | null = null;
    let newDir: string | null = null;

    if (value !== "none") {
      [newKey, newDir] = value.split("-");
    }

    setSort(newKey, newDir);
    setPage(1);

    onChange?.(newKey, newDir);
  };

  return (
    <div className={cn(isPending && "opacity-70 transition-opacity")}>
      <Select value={selectValue} onValueChange={handleValueChange}>
        <SelectTrigger className="bg-background focus:ring-1">
          <div className="flex items-center gap-2 overflow-hidden text-sm">
            <div className="truncate">
              <SelectValue placeholder={placeholder} />
            </div>
          </div>
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="none">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground/50" />
              <span>{emptyLabel}</span>
            </div>
          </SelectItem>

          {options.map((opt) => {
            const combined = `${opt.key}-${opt.direction}`;
            const ItemIcon = opt.icon || ArrowUpDown; // オプションごとのアイコン

            return (
              <SelectItem key={combined} value={combined}>
                <div className="flex items-center gap-2">
                  <ItemIcon className="h-4 w-4 text-muted-foreground" />
                  <span>{opt.label}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
