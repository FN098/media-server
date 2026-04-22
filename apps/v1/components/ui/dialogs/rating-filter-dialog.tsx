"use client";

import { useMounted } from "@/hooks/use-mounted";
import {
  RatedCondition,
  RatingFilterMode,
  RatingFilterValue,
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
  DialogTrigger,
} from "@/shadcn/components/ui/dialog";
import { Skeleton } from "@/shadcn/components/ui/skeleton";
import { cn } from "@/shadcn/lib/utils";
import { RotateCcw, Star } from "lucide-react";
import { useState } from "react";

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

// ─── 変換ヘルパー ─────────────────────────────────────────────────────────────

function toFilterInput(
  filterMode: RatingFilterMode,
  op: RatingOperator,
  value: RatingValue,
  betweenMin: RatingValue,
  betweenMax: RatingValue
): RatingFilterValue {
  if (filterMode === "all") return { mode: "all" };
  if (filterMode === "unrated") return { mode: "unrated" };

  let condition: RatedCondition;
  if (op === "between") {
    condition = { operator: "between", min: betweenMin, max: betweenMax };
  } else {
    condition = { operator: op, value };
  }
  return { mode: "rated", condition };
}

function fromFilterInput(input: RatingFilterValue): {
  filterMode: RatingFilterMode;
  op: RatingOperator;
  value: RatingValue;
  betweenMin: RatingValue;
  betweenMax: RatingValue;
} {
  if (input.mode === "all") {
    return {
      filterMode: "all",
      op: "gte",
      value: 3,
      betweenMin: 2,
      betweenMax: 4,
    };
  }
  if (input.mode === "unrated") {
    return {
      filterMode: "unrated",
      op: "gte",
      value: 3,
      betweenMin: 2,
      betweenMax: 4,
    };
  }
  const { condition } = input;
  if (condition.operator === "between") {
    return {
      filterMode: "rated",
      op: "between",
      value: 3,
      betweenMin: condition.min,
      betweenMax: condition.max,
    };
  }
  return {
    filterMode: "rated",
    op: condition.operator,
    value: condition.value,
    betweenMin: 2,
    betweenMax: 4,
  };
}

function describeFilter(input: RatingFilterValue): React.ReactNode {
  if (input.mode === "all") return null;

  if (input.mode === "unrated") {
    return (
      <span className="flex items-center gap-1">
        <StarDisplay rating={1} variant="compact" />
        未評価
      </span>
    );
  }

  const { condition } = input;

  if (condition.operator === "between") {
    return (
      <span className="flex items-center gap-1">
        <StarDisplay rating={condition.min} variant="numeric" />
        <span>〜</span>
        <StarDisplay rating={condition.max} variant="numeric" />
      </span>
    );
  }

  const opLabel = { gte: "以上", lte: "以下", eq: "ちょうど" }[
    condition.operator
  ];

  return (
    <span className="flex items-center gap-1">
      <StarDisplay rating={condition.value} variant="numeric" />
      <span>{opLabel}</span>
    </span>
  );
}

// ─── サブコンポーネント ────────────────────────────────────────────────────────

interface StarDisplayProps {
  rating: number;
  size?: number;
  variant?: "full" | "compact" | "numeric";
}

function StarDisplay({
  rating,
  size = 14,
  variant = "full",
}: StarDisplayProps) {
  // 数字だけ表示
  if (variant === "numeric") {
    return (
      <span className="inline-flex items-center gap-1 text-sm">
        <Star size={size} className="fill-current text-yellow-400" />
        <span>{rating}</span>
      </span>
    );
  }

  // 表示する星配列
  const stars =
    variant === "compact"
      ? Array.from({ length: rating }, (_, i) => i + 1)
      : RATINGS.slice().reverse(); // full

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
            onClick={() => onChange(v as RatingValue)}
            className={cn(
              "flex items-center justify-between w-full px-3 py-2 rounded-lg border text-sm transition-all",
              selected
                ? "border-primary bg-primary/5 text-primary"
                : "border-border bg-transparent text-muted-foreground hover:border-primary/40 hover:bg-accent"
            )}
          >
            <StarDisplay rating={v as RatingValue} size={13} />
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

// ─── メインコンポーネント ───────────────────────────────────────────────────────

interface RatingFilterDialogProps {
  value: RatingFilterValue;
  onChange: (value: RatingFilterValue) => void;
}

export function RatingFilterDialog({
  value,
  onChange,
}: RatingFilterDialogProps) {
  const [open, setOpen] = useState(false);

  // ダイアログ内一時状態
  const [filterMode, setFilterMode] = useState<RatingFilterMode>("all");
  const [op, setOp] = useState<RatingOperator>("gte");
  const [starValue, setStarValue] = useState<RatingValue>(3);
  const [betweenMin, setBetweenMin] = useState<RatingValue>(2);
  const [betweenMax, setBetweenMax] = useState<RatingValue>(4);

  const isActive = value.mode !== "all";
  const description = describeFilter(value);

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      // 現在の外部値を一時状態に同期
      const parsed = fromFilterInput(value);
      setFilterMode(parsed.filterMode);
      setOp(parsed.op);
      setStarValue(parsed.value);
      setBetweenMin(parsed.betweenMin);
      setBetweenMax(parsed.betweenMax);
    }
    setOpen(nextOpen);
  };

  const handleClear = () => {
    setFilterMode("all");
    setOp("gte");
    setStarValue(3);
    setBetweenMin(2);
    setBetweenMax(4);
  };

  const handleApply = () => {
    onChange(toFilterInput(filterMode, op, starValue, betweenMin, betweenMax));
    setOpen(false);
  };

  // between のとき min <= max を強制
  const handleBetweenMin = (v: RatingValue) => {
    setBetweenMin(v);
    if (v > betweenMax) setBetweenMax(v);
  };
  const handleBetweenMax = (v: RatingValue) => {
    setBetweenMax(v);
    if (v < betweenMin) setBetweenMin(v);
  };

  const mounted = useMounted();
  if (!mounted) {
    return (
      <div className="flex items-center">
        <Skeleton className="h-9 w-full rounded-md" />
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-2 h-9 w-full transition-colors",
            isActive &&
              "border-primary bg-primary/5 text-primary hover:bg-primary/10"
          )}
        >
          {isActive && description ? (
            <span>{description}</span>
          ) : (
            <>
              <Star className="h-4 w-4" />
              <span>評価で絞り込む</span>
            </>
          )}
        </Button>
      </DialogTrigger>

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

        {/* 未評価モードの説明 */}
        {filterMode === "unrated" && (
          <div className="px-6 pb-4">
            <div className="rounded-lg bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
              評価が設定されていないアイテムのみ表示します
            </div>
          </div>
        )}

        {/* すべてモードの説明 */}
        {filterMode === "all" && (
          <div className="px-6 pb-4">
            <div className="rounded-lg bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
              評価フィルターを適用しません
            </div>
          </div>
        )}

        {/* 操作ボタン */}
        <DialogFooter className="flex flex-row items-center justify-between p-6 pt-2 bg-muted/20 border-t border-muted/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={filterMode === "all"}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/5"
          >
            <RotateCcw className="mr-2 h-3.5 w-3.5" />
            リセット
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleApply}
            className="px-8 shadow-md"
          >
            決定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
