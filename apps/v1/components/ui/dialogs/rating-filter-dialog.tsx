"use client";

import { useRatingFilterDialog } from "@/hooks/dialogs/use-rating-filter-dialog";
import { useMounted } from "@/hooks/general/use-mounted";
import {
  RatingFilterMode,
  RatingOperator,
  RatingValue,
} from "@/lib/filter/types";
import { Button } from "@/shadcn/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shadcn/components/ui/dialog";
import { Skeleton } from "@/shadcn/components/ui/skeleton";
import { cn } from "@/shadcn/lib/utils";
import { RotateCcw, Star } from "lucide-react";

// ─── 定数 ────────────────────────────────────────────────────────────────────
const MODES: { value: RatingFilterMode; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "rated", label: "評価あり" },
  { value: "unrated", label: "未評価" },
];

const OPERATORS: { value: RatingOperator; label: string }[] = [
  { value: "gte", label: "以上" },
  { value: "lte", label: "以下" },
  { value: "eq", label: "ちょうど" },
  { value: "between", label: "範囲" },
];

const RATINGS = [5, 4, 3, 2, 1] as const;

interface RatingFilterDialogProps {
  dialog: ReturnType<typeof useRatingFilterDialog>;
}

export function RatingFilterDialog({ dialog }: RatingFilterDialogProps) {
  const {
    isOpen,
    filterMode,
    op,
    starValue,
    betweenMin,
    betweenMax,
    setFilterMode,
    setOp,
    setStarValue,
    handleBetweenMin,
    handleBetweenMax,
    close,
    performReset,
    performApply,
  } = dialog;

  const mounted = useMounted();

  if (!mounted) {
    return (
      <div className="flex items-center">
        <Skeleton className="h-9 w-full rounded-md" />
      </div>
    );
  }

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent
        className="sm:max-w-[420px] flex flex-col p-0 overflow-hidden"
        onEscapeKeyDown={(e) => e.stopPropagation()}
      >
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl font-semibold">
            評価で絞り込む
          </DialogTitle>
        </DialogHeader>

        {/* モード切り替え */}
        <div className="px-6 pb-3">
          <div className="flex bg-muted rounded-lg p-1">
            {MODES.map((m) => (
              <button
                key={m.value}
                type="button"
                onClick={() => setFilterMode(m.value)}
                className={cn(
                  "flex-1 text-xs font-medium py-1.5 rounded-md transition-all",
                  filterMode === m.value
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* 評価ありモードのみ表示 */}
        {filterMode === "rated" && (
          <>
            {/* 比較演算子 */}
            <div className="px-6 pb-3">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                比較演算子
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                {OPERATORS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setOp(o.value)}
                    className={cn(
                      "text-xs font-medium py-2 px-1 rounded-lg border transition-all",
                      op === o.value
                        ? "border-primary bg-primary/5 text-primary shadow-sm"
                        : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 星選択 */}
            <div className="px-6 pb-3">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                ★ の数を選択
              </p>

              {op === "between" ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">から</p>
                    <StarPicker
                      value={betweenMin}
                      onChange={handleBetweenMin}
                    />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">まで</p>
                    <StarPicker
                      value={betweenMax}
                      onChange={handleBetweenMax}
                    />
                  </div>
                </div>
              ) : (
                <StarPicker value={starValue} onChange={setStarValue} />
              )}
            </div>
          </>
        )}

        {/* ヘルパーテキスト表示エリア */}
        {(filterMode === "unrated" || filterMode === "all") && (
          <div className="px-6 pb-4">
            <div className="rounded-lg bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
              {filterMode === "unrated"
                ? "評価が設定されていないアイテムのみ表示します"
                : "評価フィルターを適用しません"}
            </div>
          </div>
        )}

        {/* 操作ボタン */}
        <DialogFooter className="flex flex-row items-center justify-between p-6 pt-2 bg-muted/20 border-t border-muted/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={performReset}
            disabled={filterMode === "all"}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/5"
          >
            <RotateCcw className="mr-2 h-3.5 w-3.5" />
            リセット
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={performApply}
            className="px-8 shadow-md"
          >
            決定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── 内包サブコンポーネント (変更なし・記述省略を防止) ───────────────────────
interface StarDisplayProps {
  rating: number;
  size?: number;
  variant?: "full" | "compact" | "numeric";
}

export function StarDisplay({
  rating,
  size = 14,
  variant = "full",
}: StarDisplayProps) {
  if (variant === "numeric") {
    return (
      <span className="inline-flex items-center gap-1 text-sm">
        <Star size={size} className="fill-current text-yellow-400" />
        <span>{rating}</span>
      </span>
    );
  }
  const stars =
    variant === "compact"
      ? Array.from({ length: rating }, (_, i) => i + 1)
      : RATINGS.slice().reverse();
  return (
    <span className="inline-flex items-center gap-0.5">
      {stars.map((v) => (
        <Star
          key={v}
          size={size}
          className={cn(
            "fill-current",
            variant === "compact"
              ? "text-yellow-400"
              : v <= rating
                ? "text-yellow-400"
                : "text-muted-foreground/20"
          )}
        />
      ))}
    </span>
  );
}

interface StarPickerProps {
  value: RatingValue;
  onChange: (v: RatingValue) => void;
}

function StarPicker({ value, onChange }: StarPickerProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {RATINGS.map((v) => {
        const selected = v === value;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={cn(
              "flex items-center justify-between w-full px-3 py-2 rounded-lg border text-sm transition-all",
              selected
                ? "border-primary bg-primary/5 text-primary"
                : "border-border bg-transparent text-muted-foreground hover:border-primary/40 hover:bg-accent"
            )}
          >
            <StarDisplay rating={v} size={13} />
            {selected && (
              <span className="text-[10px] font-medium text-primary">
                選択中
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
