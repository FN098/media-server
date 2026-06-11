import {
  RatedCondition,
  RatingFilterValue,
  RatingValue,
} from "@/lib/filter/types";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

// --- URL parse helpers ---

function toRatingValue(raw: string | null | undefined): RatingValue | null {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 && n <= 5 ? (n as RatingValue) : null;
}

function parseCondition(
  op: string | null,
  val: string | null
): RatedCondition | null {
  if (!op || !val) return null;
  if (op === "between") {
    const [minRaw, maxRaw] = val.split(",");
    const min = toRatingValue(minRaw);
    const max = toRatingValue(maxRaw);
    if (min === null || max === null) return null;
    return { operator: "between", min, max };
  }
  if (op === "gte" || op === "lte" || op === "eq") {
    const value = toRatingValue(val);
    if (value === null) return null;
    return { operator: op, value };
  }
  return null;
}

function parseFilterValue(
  mode: string | null,
  op: string | null,
  val: string | null
): RatingFilterValue {
  if (mode === "unrated") return { mode: "unrated" };
  if (mode === "rated") {
    const condition = parseCondition(op, val);
    if (!condition) return { mode: "all" };
    return { mode: "rated", condition };
  }
  return { mode: "all" };
}

// --- URL serialize helpers ---

function serializeCondition(condition: RatedCondition): {
  op: string;
  val: string;
} {
  if (condition.operator === "between") {
    return { op: "between", val: `${condition.min},${condition.max}` };
  }
  return { op: condition.operator, val: String(condition.value) };
}

function buildParams(
  params: URLSearchParams,
  next: RatingFilterValue,
  keys: { modeKey: string; opKey: string; valKey: string }
): void {
  const { modeKey, opKey, valKey } = keys;
  if (next.mode === "all") {
    params.delete(modeKey);
    params.delete(opKey);
    params.delete(valKey);
    return;
  }
  if (next.mode === "unrated") {
    params.set(modeKey, "unrated");
    params.delete(opKey);
    params.delete(valKey);
    return;
  }
  const { op, val } = serializeCondition(next.condition);
  params.set(modeKey, "rated");
  params.set(opKey, op);
  params.set(valKey, val);
}

interface UseRatingFilterProps {
  ratingModeKey?: string;
  ratingOpKey?: string;
  ratingValKey?: string;
}

export function useRatingFilter({
  ratingModeKey = "ratingMode",
  ratingOpKey = "ratingOp",
  ratingValKey = "ratingVal",
}: UseRatingFilterProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URLから現在の値を復元
  const value = useMemo<RatingFilterValue>(
    () =>
      parseFilterValue(
        searchParams.get(ratingModeKey),
        searchParams.get(ratingOpKey),
        searchParams.get(ratingValKey)
      ),
    [searchParams, ratingModeKey, ratingOpKey, ratingValKey]
  );

  const apply = useCallback(
    (next: RatingFilterValue) => {
      const params = new URLSearchParams(searchParams.toString());
      buildParams(params, next, {
        modeKey: ratingModeKey,
        opKey: ratingOpKey,
        valKey: ratingValKey,
      });
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams, ratingModeKey, ratingOpKey, ratingValKey]
  );

  const reset = useCallback(() => apply({ mode: "all" }), [apply]);

  const isActive = value.mode !== "all";

  const applyUnrated = useCallback(() => apply({ mode: "unrated" }), [apply]);

  const applyRated = useCallback(
    (condition: RatedCondition) => apply({ mode: "rated", condition }),
    [apply]
  );

  return {
    value,
    isActive,
    apply,
    reset,
    applyUnrated,
    applyRated,
  };
}
