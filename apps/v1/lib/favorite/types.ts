import { PathType } from "@/lib/path/types";

export type IsFavoriteType = boolean;
export type FavoritesRecord = Record<PathType, IsFavoriteType>;
export type FavoritesMap = Map<PathType, IsFavoriteType>;
