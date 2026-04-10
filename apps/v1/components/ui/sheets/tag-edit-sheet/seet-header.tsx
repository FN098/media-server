import {
  EditingMode,
  TagEditMode,
} from "@/components/ui/sheets/tag-edit-sheet/types";
import { Button } from "@/shadcn/components/ui/button";
import { Label } from "@/shadcn/components/ui/label";
import { Switch } from "@/shadcn/components/ui/switch";
import { cn } from "@/shadcn/lib/utils";
import { Eye, EyeOff, TagIcon, X } from "lucide-react";

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
  opacity,
  onOpacityChange,
  onClose,
}: SheetHeaderProps) {
  const textMap = {
    single: {
      "edit-title": "タグを編集",
      "view-title": "タグ一覧",
      selection: "",
    },
    default: {
      "edit-title": "一括タグ編集",
      "view-title": "タグ一覧",
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

  const isBlur = opacity > 50;

  return (
    <div className="flex flex-col items-center justify-between w-full px-2 gap-4">
      <div className="flex items-center justify-between w-full h-12 px-2 gap-4">
        {/* タイトルエリア */}
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/10 shrink-0 text-primary border border-primary/10 shadow-inner">
            <TagIcon size={16} className="stroke-[2.5]" />
          </div>
          <div className="flex flex-col min-w-0">
            <h3 className="text-sm font-extrabold truncate leading-tight tracking-tight text-foreground/90">
              {title}
            </h3>
            {selection && (
              <p className="text-[10px] text-muted-foreground truncate opacity-90 font-medium">
                {selection}
              </p>
            )}
          </div>
        </div>

        {/* ブラースイッチ */}
        <div className="flex items-center gap-3 shrink-0 sm:ml-auto">
          <Label
            htmlFor="blur-switch"
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <div
              className={cn(
                "p-1.5 rounded-lg border transition-all shadow-sm",
                isBlur
                  ? "bg-sky-500/10 border-sky-500/30 text-sky-500"
                  : "bg-background/10 border-border text-muted-foreground/60"
              )}
            >
              {isBlur ? (
                <Eye size={16} className="stroke-[2.5]" />
              ) : (
                <EyeOff size={16} className="stroke-[2.5]" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-foreground/90 select-none leading-tight">
                背景ブラー
              </span>
              <span className="text-[9px] text-muted-foreground/80 select-none font-medium">
                {isBlur ? "ON (100%)" : "OFF (0%)"}
              </span>
            </div>
          </Label>

          <Switch
            id="blur-switch"
            checked={isBlur}
            onCheckedChange={(checked) => onOpacityChange(checked ? 100 : 0)}
            className={cn(
              "scale-100",
              "data-[state=checked]:bg-sky-500 data-[state=unchecked]:bg-input",
              "border border-sky-600/20 shadow-inner"
            )}
          />
        </div>

        {/* 閉じるボタン */}
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 rounded-full hover:bg-muted/80 hover:text-foreground text-muted-foreground/80 transition-all opacity-60 group-hover:opacity-100"
          onClick={onClose}
        >
          <X size={18} className="stroke-[2.5]" />
        </Button>
      </div>

      {/* モード切り替えスイッチ */}
      <div className="flex w-full sm:w-auto gap-0.5 bg-background/10 border border-border/60 rounded-full p-1 shadow-md">
        {(["view", "quick", "edit"] as const).map((m) => {
          const isActive = editingMode === m;
          return (
            <button
              key={m}
              onClick={() => setEditingMode(m)}
              className={cn(
                "text-[11px] px-5 py-2 rounded-full transition-all duration-300 ease-out flex-1 sm:flex-none whitespace-nowrap",
                "font-bold uppercase tracking-widest leading-none text-[11px]",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md scale-105"
                  : "text-muted-foreground/80 hover:text-foreground hover:bg-muted/50"
              )}
            >
              {{ view: "View", quick: "Quick", edit: "Detail" }[m]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
