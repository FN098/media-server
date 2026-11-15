import { FileType } from "@/lib/node/types";

// ===== クエリフィルター =====
export type QueryFilterValue = {
  query?: string | null;
};

// ===== ファイル種別フィルター =====
export type FileTypeFilterValue = {
  types: FileType[];
};

// ===== タグフィルター =====
export type TagFilterMode = "AND" | "OR" | "NOT" | "EMPTY";

export type TagFilterValue = {
  tags: { id: string; name: string }[];
  mode: TagFilterMode;
};

// ===== お気に入りフィルター =====
export type FavoriteFilterMode = "all" | "only_favorites" | "exclude_favorites";

export type FavoriteFilterValue = {
  mode: FavoriteFilterMode;
};
