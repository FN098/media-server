import {
  RatedCondition,
  RatingFilterMode,
  RatingFilterValue,
  RatingOperator,
  RatingValue,
} from "@/lib/filter/types";
import { useCallback, useState } from "react";

interface UseRatingFilterDialogProps {
  onApply?: (value: RatingFilterValue) => void;
}

export function useRatingFilterDialog({
  onApply,
}: UseRatingFilterDialogProps = {}) {
  const [isOpen, setIsOpen] = useState(false);

  // ダイアログ内部の「編集中の仮状態」を一括管理
  const [filterMode, setFilterMode] = useState<RatingFilterMode>("all");
  const [op, setOp] = useState<RatingOperator>("gte");
  const [starValue, setStarValue] = useState<RatingValue>(3);
  const [betweenMin, setBetweenMin] = useState<RatingValue>(2);
  const [betweenMax, setBetweenMax] = useState<RatingValue>(4);

  // 1. ダイアログを開く（現在の設定値を反映させて初期化）
  const open = useCallback((currentValue: RatingFilterValue) => {
    const parsed = fromFilterInput(currentValue);
    setFilterMode(parsed.filterMode);
    setOp(parsed.op);
    setStarValue(parsed.value);
    setBetweenMin(parsed.betweenMin);
    setBetweenMax(parsed.betweenMax);
    setIsOpen(true);
  }, []);

  // 2. ダイアログを閉じる
  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  // 3. 一時編集状態のリセット
  const performReset = useCallback(() => {
    setFilterMode("all");
    setOp("gte");
    setStarValue(3);
    setBetweenMin(2);
    setBetweenMax(4);
  }, []);

  // 4. フィルターの確定（親コンポーネントへコミット）
  const performApply = useCallback(() => {
    const resultValue = toFilterInput(
      filterMode,
      op,
      starValue,
      betweenMin,
      betweenMax
    );
    onApply?.(resultValue);
    close();
  }, [filterMode, op, starValue, betweenMin, betweenMax, onApply, close]);

  // 5. 範囲選択（between）時の最小値ガードロジック
  const handleBetweenMin = useCallback((v: RatingValue) => {
    setBetweenMin(v);
    setBetweenMax((prevMax) => (v > prevMax ? v : prevMax));
  }, []);

  // 6. 範囲選択（between）時の最大値ガードロジック
  const handleBetweenMax = useCallback((v: RatingValue) => {
    setBetweenMax(v);
    setBetweenMin((prevMin) => (v < prevMin ? v : prevMin));
  }, []);

  return {
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
    open,
    close,
    performReset,
    performApply,
  };
}

function toFilterInput(
  filterMode: RatingFilterMode,
  op: RatingOperator,
  value: RatingValue,
  betweenMin: RatingValue,
  betweenMax: RatingValue
): RatingFilterValue {
  if (filterMode === "all") return { mode: "all" };
  if (filterMode === "unrated") return { mode: "unrated" };

  const condition: RatedCondition =
    op === "between"
      ? { operator: "between", min: betweenMin, max: betweenMax }
      : { operator: op, value };

  return { mode: "rated", condition };
}

function fromFilterInput(input: RatingFilterValue) {
  const defaults = {
    op: "gte" as const,
    value: 3 as RatingValue,
    betweenMin: 2 as RatingValue,
    betweenMax: 4 as RatingValue,
  };
  if (input.mode === "all" || input.mode === "unrated") {
    return { filterMode: input.mode, ...defaults };
  }
  const { condition } = input;
  if (condition.operator === "between") {
    return {
      filterMode: "rated" as const,
      op: "between" as const,
      value: 3 as RatingValue,
      betweenMin: condition.min,
      betweenMax: condition.max,
    };
  }
  return {
    filterMode: "rated" as const,
    op: condition.operator,
    value: condition.value,
    betweenMin: 2 as RatingValue,
    betweenMax: 4 as RatingValue,
  };
}
