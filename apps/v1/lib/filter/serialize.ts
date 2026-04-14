import { RatingFilterInput, RatingValue } from "@/lib/filter/types";

export function serializeRatingFilter(filter: RatingFilterInput): string {
  switch (filter.mode) {
    case "all":
      return "all";
    case "unrated":
      return "unrated";
    case "rated": {
      const c = filter.condition;
      switch (c.operator) {
        case "gte":
          return `gte:${c.value}`;
        case "lte":
          return `lte:${c.value}`;
        case "eq":
          return `eq:${c.value}`;
        case "between":
          return `between:${c.min}-${c.max}`;
      }
    }
  }
}

export function deserializeRatingFilter(v: string): RatingFilterInput {
  if (v === "all") return { mode: "all" };
  if (v === "unrated") return { mode: "unrated" };

  const [op, rest] = v.split(":");

  if (op === "between") {
    const [min, max] = rest.split("-").map(Number) as [
      RatingValue,
      RatingValue,
    ];
    return {
      mode: "rated",
      condition: { operator: "between", min, max },
    };
  }

  const value = Number(rest) as RatingValue;

  return {
    mode: "rated",
    condition: {
      operator: op as "gte" | "lte" | "eq",
      value,
    },
  };
}
