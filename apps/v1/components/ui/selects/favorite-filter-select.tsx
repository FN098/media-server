"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/components/ui/select";
import { RotateCcw, Star, StarOff } from "lucide-react";

// 'all' は内部的なリセット状態として扱う
type FavoriteFilterMode = "all" | "only_favorites" | "exclude_favorites";

type FavoriteFilterValue = {
  mode: FavoriteFilterMode;
};

interface FavoriteFilterSelectProps {
  value: FavoriteFilterValue;
  onChange: (value: FavoriteFilterValue) => void;
}

export const FavoriteFilterSelect = ({
  value,
  onChange,
}: FavoriteFilterSelectProps) => {
  // 表示設定の定義
  const options = [
    {
      key: "only_favorites",
      label: "お気に入りのみ",
      icon: <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />,
    },
    {
      key: "exclude_favorites",
      label: "お気に入り以外",
      icon: <StarOff className="h-4 w-4" />,
    },
  ] as const;

  const handleValueChange = (value: string) => {
    if (value === "reset") {
      onChange({ mode: "all" });
    } else {
      onChange({ mode: value as FavoriteFilterMode });
    }
  };

  // 'all' の場合は undefined にして placeholder を出す
  const selectedKey = value.mode === "all" ? undefined : value.mode;
  const isFiltered = value.mode !== "all";

  // 現在の選択内容を取得（表示用）
  const currentOption = options.find((opt) => opt.key === selectedKey);

  return (
    <div className="w-full">
      <Select
        key={selectedKey} // リセット時に表示を強制更新するため
        value={selectedKey}
        onValueChange={handleValueChange}
      >
        <SelectTrigger className="bg-background focus:ring-1 w-full h-9">
          <div className="flex items-center gap-2 overflow-hidden text-sm">
            <div className="truncate">
              <SelectValue
                placeholder={
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Star className="h-4 w-4 shrink-0" />
                    <span>お気に入りで絞り込む</span>
                  </div>
                }
              >
                {currentOption && (
                  <div className="flex items-center gap-2">
                    {currentOption.icon}
                    <span>{currentOption.label}</span>
                  </div>
                )}
              </SelectValue>
            </div>
          </div>
        </SelectTrigger>

        <SelectContent>
          {isFiltered && (
            <>
              <SelectItem
                value="reset"
                className="text-destructive focus:text-destructive focus:bg-destructive/5"
              >
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4" />
                  <span>リセットする</span>
                </div>
              </SelectItem>
              <div className="my-1 h-px bg-muted" />
            </>
          )}

          {options.map((opt) => (
            <SelectItem key={opt.key} value={opt.key}>
              <div className="flex items-center gap-2">
                {opt.icon}
                <span>{opt.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
