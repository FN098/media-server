"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/components/ui/select";
import { cn } from "@/shadcn/lib/utils";
import { LucideSortAsc } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

// 型定義をエクスポートして親コンポーネントで使いやすくする
export interface SortOption {
  key: string;
  direction: "asc" | "desc";
  label: string;
}

interface SortSelectProps {
  options: SortOption[];
  placeholder?: string;
  emptyLabel?: string;
}

export function SortSelect({
  options,
  placeholder = "並び替え",
  emptyLabel = "ソートなし",
}: SortSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSort = searchParams.get("sort");
  const currentDirection = searchParams.get("direction");

  // 現在の URL パラメータに一致するオプションがあるか確認
  const currentValue =
    currentSort && currentDirection
      ? `${currentSort}-${currentDirection}`
      : "none";

  const handleValueChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (value === "none") {
        params.delete("sort");
        params.delete("direction");
      } else {
        const [key, direction] = value.split("-");
        params.set("sort", key);
        params.set("direction", direction);
      }

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [pathname, router, searchParams]
  );

  return (
    <div className={cn(isPending ? "opacity-70" : "")}>
      <Select value={currentValue} onValueChange={handleValueChange}>
        <SelectTrigger className="bg-background">
          <LucideSortAsc className="h-4 w-4 text-muted-foreground" />
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">{emptyLabel}</SelectItem>
          {options.map((opt) => (
            <SelectItem
              key={`${opt.key}-${opt.direction}`}
              value={`${opt.key}-${opt.direction}`}
            >
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
