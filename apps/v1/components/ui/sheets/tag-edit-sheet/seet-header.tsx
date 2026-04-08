import { EditingMode, TagEditMode } from "@/components/ui/sheets/types";
import { Button } from "@/shadcn/components/ui/button";
import { Slider } from "@/shadcn/components/ui/slider";
import { cn } from "@/shadcn/lib/utils";
import { Edit2, Eye, TagIcon, X } from "lucide-react";

interface SheetHeaderProps {
  mode: TagEditMode;
  count: number;
  editingMode: EditingMode;
  setEditingMode: (mode: EditingMode) => void;
  canEdit: boolean;
  opacity: number;
  onOpacityChange: (val: number) => void;
  onEditClick: () => void;
  onClose: () => void;
}

export function SheetHeader({
  mode,
  count,
  editingMode,
  setEditingMode,
  canEdit,
  opacity,
  onOpacityChange,
  onEditClick,
  onClose,
}: SheetHeaderProps) {
  const textMap = {
    single: {
      "edit-title": "タグを編集",
      "view-title": "タグ",
      selection: "",
    },
    default: {
      "edit-title": "一括タグ編集",
      "view-title": "タグ",
      selection: `${count}件を選択中`,
    },
    none: {
      "edit-title": "",
      "view-title": "",
      selection: "",
    },
  } as const;

  const title =
    textMap[mode][editingMode !== "view" ? "edit-title" : "view-title"];
  const selection = textMap[mode]["selection"];

  return (
    <div
      className="flex items-center gap-3 w-full"
      style={{
        color: `color-mix(in oklch, var(--secondary-foreground) ${Math.max(70, opacity)}%, transparent)`,
      }}
    >
      {/* アイコン＋タイトル */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="p-1.5 rounded-full bg-primary/10 shrink-0">
          <TagIcon size={16} />
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1">
            <h3 className="text-sm font-bold truncate leading-none">{title}</h3>

            {/* 編集ボタン */}
            {editingMode === "view" && (
              <Button
                size="icon"
                variant="ghost"
                className="h-5 w-5 p-0 hover:bg-primary/10 shrink-0 hidden" // 一時的に非表示にしておく
                onClick={onEditClick}
                disabled={!canEdit}
              >
                <Edit2 size={12} />
              </Button>
            )}
          </div>

          {/* 一括編集時の選択件数 */}
          {selection && (
            <p className="text-[9px] text-muted-foreground truncate line-clamp-1">
              {selection}
            </p>
          )}
        </div>
      </div>

      {/* モード切り替えスイッチ */}
      <div className="flex gap-1 bg-muted/30 rounded-lg p-0.5 shrink-0">
        {(["view", "quick", "edit"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setEditingMode(m)}
            className={cn(
              "text-[11px] px-2.5 py-1 rounded-md transition-colors",
              editingMode === m
                ? "bg-background text-foreground font-medium shadow-sm"
                : "text-muted-foreground"
            )}
          >
            {{ view: "閲覧", quick: "クイック", edit: "詳細" }[m]}
          </button>
        ))}
      </div>

      {/* 透過スライダー */}
      <div
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-border/40 flex-1 max-w-[120px] ml-auto"
        style={{
          backgroundColor: `color-mix(in oklch, var(--muted) 5%, transparent)`,
        }}
      >
        <Eye size={12} className="text-muted-foreground/60 shrink-0" />
        <Slider
          value={[opacity]}
          min={0}
          max={100}
          onValueChange={(vals) => onOpacityChange(vals[0])}
          className={cn(
            "flex-1 cursor-pointer",
            "[&_[data-slot=slider-track]]:bg-muted/30",
            "[&_[data-slot=slider-range]]:bg-transparent",
            "[&_[data-slot=slider-thumb]]:size-3 [&_[data-slot=slider-thumb]]:bg-muted-foreground/80 [&_[data-slot=slider-thumb]]:border-none"
          )}
        />
        <span className="text-[9px] font-mono text-muted-foreground/80 tabular-nums shrink-0">
          {opacity}
        </span>
      </div>

      {/* 閉じるボタン */}
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8 rounded-full bg-muted/20 hover:bg-muted/40 shrink-0"
        onClick={onClose}
      >
        <X size={18} />
      </Button>
    </div>
  );
}
