import { NodeFilter } from "@/lib/node/types";

export type FavoriteFilterMode = "all" | "only_favorites" | "exclude_favorites";

export type FavoriteFilterValue = {
  mode: FavoriteFilterMode;
};

export function createFavoriteFilter(value: FavoriteFilterValue): NodeFilter {
  return (node) => {
    switch (value.mode) {
      case "only_favorites":
        return !!node.favoritedAt;

      case "exclude_favorites":
        return !node.favoritedAt;

      case "all":

      default:
        return true;
    }
  };
}
