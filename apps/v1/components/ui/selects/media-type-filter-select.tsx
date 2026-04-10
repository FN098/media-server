"use client";

import { MediaFsNodeType, MediaTypeFilterValue } from "@/lib/media/types";
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
  Folder,
  Image as ImageIcon,
  Music,
  Type,
  Video,
} from "lucide-react";

interface MediaTypeFilterSelectProps {
  value: MediaTypeFilterValue;
  onChange: (value: MediaTypeFilterValue) => void;
  className?: string;
  excludeTypes?: MediaFsNodeType[];
}

// 型に応じたアイコンとラベルの定義
const TYPE_CONFIG: Record<
  MediaFsNodeType,
  { label: string; icon: React.ElementType }
> = {
  directory: { label: "フォルダ", icon: Folder },
  image: { label: "画像", icon: ImageIcon },
  video: { label: "動画", icon: Video },
  audio: { label: "音声", icon: Music },
  file: { label: "その他ファイル", icon: File },
};

export function MediaTypeFilterSelect({
  value,
  onChange,
  className,
  excludeTypes = [],
}: MediaTypeFilterSelectProps) {
  // 表示対象のタイプを抽出
  const displayTypes = (Object.keys(TYPE_CONFIG) as MediaFsNodeType[]).filter(
    (type) => !excludeTypes.includes(type)
  );

  // 選択中のアイコンを取得（除外されていても表示崩れしないようにフォールバック付き）
  const SelectedIcon =
    value !== "all" && TYPE_CONFIG[value] ? TYPE_CONFIG[value].icon : Type;

  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v as MediaFsNodeType | "all")}
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
        <SelectItem value="all">
          <span className="text-muted-foreground">すべての種別</span>
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
