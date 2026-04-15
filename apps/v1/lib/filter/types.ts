import { MediaFsNodeType } from "@/lib/media/types";

export type RatingValue = 1 | 2 | 3 | 4 | 5;
export type RatingFilterMode = "all" | "unrated" | "rated";
export type RatingOperator = "gte" | "lte" | "eq" | "between";

export type RatedCondition =
  | { operator: "gte"; value: RatingValue }
  | { operator: "lte"; value: RatingValue }
  | { operator: "eq"; value: RatingValue }
  | { operator: "between"; min: RatingValue; max: RatingValue };

export type RatingFilterInput =
  | { mode: "all" }
  | { mode: "unrated" }
  | { mode: "rated"; condition: RatedCondition };

export type MediaTypeFilterValue = MediaFsNodeType | "all";
