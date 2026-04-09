"use client";

import { useSort } from "@/hooks/use-sort";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/components/ui/select";
import { cn } from "@/shadcn/lib/utils";
import { ArrowUpDown, LucideIcon, RotateCcw } from "lucide-react";

export interface SortOption {
  key?: string;
  direction?: string;
  label?: string;
  icon?: LucideIcon;
}

interface SortSelectProps {
  options: SortOption[];
  placeholder?: string;
  resetLabel?: string;
  onChange?: (key: string | null, dir: string | null) => void;
}

export function SortSelect({
  options,
  placeholder = "並び替え",
  resetLabel = "リセットする",
  onChange,
}: SortSelectProps) {
  const { sort, direction, setSort, isPending } = useSort();

  // 現在の URL パラメータの組み合わせ
  const currentKeyDir = sort && direction ? `${sort}-${direction}` : null;

  // options の中に現在の値が存在するかチェック
  const isValidOption = options.some(
    (opt) => `${opt.key}-${opt.direction}` === currentKeyDir
  );

  // 有効なオプションがある場合のみ値をセット。なければ undefined (placeholder表示)
  const selectValue = isValidOption ? (currentKeyDir as string) : undefined;

  // ソートが適用されているか判定（リセットボタンの表示用）
  const isSorted = !!selectValue;

  const handleValueChange = (value: string) => {
    let newKey: string | null = null;
    let newDir: string | null = null;

    if (value !== "none") {
      [newKey, newDir] = value.split("-");
    }

    setSort(newKey, newDir);
    onChange?.(newKey, newDir);
  };

  return (
    <div className={cn("w-full", isPending && "opacity-70 transition-opacity")}>
      <Select
        // selectValue が変わった時にコンポーネントを正しく再描画させる
        key={selectValue || "reset"}
        value={selectValue}
        onValueChange={handleValueChange}
      >
        <SelectTrigger className="bg-background focus:ring-1 w-full">
          <div className="flex items-center gap-2 overflow-hidden text-sm">
            <div className="truncate">
              <SelectValue
                placeholder={
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>{placeholder}</span>
                  </div>
                }
              />
            </div>
          </div>
        </SelectTrigger>

        <SelectContent>
          {isSorted && (
            <>
              <SelectItem
                value="none"
                className="text-destructive focus:text-destructive"
              >
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4" />
                  <span>{resetLabel}</span>
                </div>
              </SelectItem>
              <div className="my-1 h-px bg-muted" />
            </>
          )}

          {options.map((opt) => {
            const combined = `${opt.key}-${opt.direction}`;
            const ItemIcon = opt.icon || ArrowUpDown;

            return (
              <SelectItem key={combined} value={combined}>
                <div className="flex items-center gap-2">
                  <ItemIcon className="h-4 w-4 text-muted-foreground" />
                  <span>{opt.label || "ソート"}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
