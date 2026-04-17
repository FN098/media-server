// 評価フィルター
export type RatingValue = 1 | 2 | 3 | 4 | 5;
export type RatingFilterMode = "all" | "unrated" | "rated";
export type RatingOperator = "gte" | "lte" | "eq" | "between";
export type RatingMode = "all" | "unrated" | "rated";

export type RatedCondition =
  | { operator: "gte"; value: RatingValue }
  | { operator: "lte"; value: RatingValue }
  | { operator: "eq"; value: RatingValue }
  | { operator: "between"; min: RatingValue; max: RatingValue };

export type RatingFilterValue =
  | { mode: "all" }
  | { mode: "unrated" }
  | { mode: "rated"; condition: RatedCondition };

export type RatingFilterOptions = {
  ratingModeKey?: string;
  ratingOpKey?: string;
  ratingValKey?: string;
};

// 種別フィルター
export type MediaTypeFilterValue =
  | "all"
  | "directory"
  | "image"
  | "video"
  | "audio";

export type MediaTypeFilterOptions = {
  mediaTypeKey?: string;
};

// タグフィルター
export type TagFilterMode = "AND" | "OR" | "NOT" | "EMPTY";

export type TagFilterValue = {
  tags: { id: string; name: string }[];
  mode: TagFilterMode;
};

export type TagFilterOptions = {
  tagsKey?: string;
  modeKey?: string;
};
