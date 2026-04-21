import { MediaNode } from "@/lib/media/types";

export type FavoriteValue = {
  path: string;
  rating: number | null;
  favoritedAt?: Date;
};

export type FavoriteSortKey = Extract<
  keyof MediaNode,
  "name" | "path" | "mtime" | "size" | "rating" | "favoritedAt" | "title"
>;
