"use client";

import { MediaTypeFilterValue } from "@/lib/filter/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shadcn/components/ui/select";
import { cn } from "@/shadcn/lib/utils";
import {
  File,
  Film,
  Folder,
  Image as ImageIcon,
  Music,
  Type,
} from "lucide-react";

interface MediaTypeFilterSelectProps {
  value: MediaTypeFilterValue;
  onChange: (value: MediaTypeFilterValue) => void;
  className?: string;
  displayTypes?: MediaTypeFilterValue[];
}

// 型に応じたアイコンとラベルの定義
const TYPE_CONFIG = {
  all: { label: "すべて", icon: File },
  directory: { label: "フォルダ", icon: Folder },
  image: { label: "画像", icon: ImageIcon },
  video: { label: "動画", icon: Film },
  audio: { label: "オーディオ", icon: Music },
};

export function MediaTypeFilterSelect({
  value,
  onChange,
  className,
  displayTypes = ["directory", "image", "video", "audio"],
}: MediaTypeFilterSelectProps) {
  // 選択中のアイコンを取得（除外されていても表示崩れしないようにフォールバック付き）
  const SelectedIcon =
    value !== "all" && TYPE_CONFIG[value] ? TYPE_CONFIG[value].icon : Type;

  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v as MediaTypeFilterValue)}
    >
      <SelectTrigger className={cn("w-full h-9", className)}>
        {value === "all" ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <SelectedIcon size={14} />
            <span>種別で絞り込む</span>
          </div>
        ) : (
          <SelectValue />
        )}
      </SelectTrigger>

      <SelectContent>
        {/* 種別選択リセット */}
        <SelectItem value="all" className="text-muted-foreground">
          <span>すべての種別</span>
        </SelectItem>

        {/* セパレータ */}
        <div className="my-1 h-px bg-muted" />

        {/* 種別選択オプション */}
        {displayTypes.map((type) => {
          const config = TYPE_CONFIG[type];
          const Icon = config.icon;
          return (
            <SelectItem key={type} value={type}>
              <div className="flex items-center gap-2">
                <Icon size={14} className="text-muted-foreground" />
                <span className="text-sm">{config.label}</span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
