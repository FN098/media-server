"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/components/ui/select";
import { cn } from "@/shadcn/lib/utils";
import { ArrowUpDown, LucideIcon, RotateCcw } from "lucide-react";

type SortValue = {
  sort: string; // 並び替えのフィールド名
  direction: "asc" | "desc"; // 並び替えの向き
};

type SelectOption = {
  value: SortValue; // 選択項目の値
  label: string; // 選択項目の表示名
  icon?: LucideIcon; // 選択項目のアイコン
};

interface SortSelectProps {
  value: SortValue | null;
  onChange: (value: SortValue | null) => void;
  options: readonly SelectOption[];
}

function combine(value: SortValue): string {
  return `${value.sort}-${value.direction}`;
}

function separate(value: string): SortValue {
  const [sort, direction] = value.split("-");
  return { sort, direction } as SortValue;
}

export function SortSelect({ value, onChange, options }: SortSelectProps) {
  const currentKey = value ? combine(value) : null;

  // options の中に現在の値が存在するかチェック
  const isValidOption =
    !!currentKey && options.some((opt) => combine(opt.value) === currentKey);

  // 有効なオプションがある場合のみ値をセット。なければ undefined (placeholder表示)
  const selectedKey = isValidOption ? currentKey : undefined;

  // ソートが適用されているか判定（リセットボタンの表示用）
  const isSorted = !!selectedKey;

  const handleValueChange = (value: string) => {
    if (onChange) {
      if (value === "reset") {
        onChange(null);
        return;
      }

      const next = separate(value);
      onChange(next);
    }
  };

  return (
    <div className={cn("w-full")}>
      <Select
        // selectValue が変わった時にコンポーネントを正しく再描画させる
        key={selectedKey || "reset"}
        value={selectedKey}
        onValueChange={handleValueChange}
      >
        <SelectTrigger className="bg-background focus:ring-1 w-full">
          <div className="flex items-center gap-2 overflow-hidden text-sm">
            <div className="truncate">
              <SelectValue
                placeholder={
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span>並び替え</span>
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
                value="reset"
                className="text-destructive focus:text-destructive"
              >
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4" />
                  <span>リセットする</span>
                </div>
              </SelectItem>
              <div className="my-1 h-px bg-muted" />
            </>
          )}

          {options.map((opt) => {
            const combined = combine(opt.value);
            const Icon = opt.icon || ArrowUpDown;

            return (
              <SelectItem key={combined} value={combined}>
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
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
