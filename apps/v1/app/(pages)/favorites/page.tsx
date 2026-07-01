import { APP_CONFIG } from "@/app.config";
import { FavoritesControlProvider } from "@/feature/favorite/providers/favorites-control-provider";
import { Favorites } from "@/feature/favorites";
import { FavoritesProvider } from "@/feature/favorites/providers/favorites-provider";
import { PathSelectionProvider } from "@/feature/selection/providers/path-selection-provider";
import { resolveCurrentUserOrThrow } from "@/lib/auth/current-user";
import { searchFavoriteMediaNodes } from "@/lib/favorite/search";
import { Favorite, FavoriteSortKey } from "@/lib/favorite/types";
import {
  RatingFilterMode,
  RatingOperator,
  TagFilterMode,
} from "@/lib/filter/types";
import { formatNodes } from "@/lib/media/formatters";
import { SortDirection } from "@/lib/media/sort";
import { hashObject } from "@/lib/utils/fnv1a-hash";
import { Metadata } from "next";

// 動的ページとしてレンダリング
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Favorites | ${APP_CONFIG.meta.title}`,
};

interface FavoritePageProps {
  // URLクエリパラメータ: ?sort=name&direction=asc
  searchParams: Promise<{
    sort?: FavoriteSortKey;
    direction?: SortDirection;
    shuffle?: boolean;
    seed?: string;
    mediaType?: string; // カンマ区切り
    q?: string;
    ratingMode?: RatingFilterMode;
    ratingOp?: RatingOperator;
    ratingVal?: string; // 1~5 の数値 or {min},{max}
    tagFilterMode?: TagFilterMode;
    tagIds?: string; // カンマ区切り
  }>;
}

export default async function FavoritePage(props: FavoritePageProps) {
  const searchParams = await props.searchParams;
  const {
    sort,
    direction,
    shuffle,
    seed,
    mediaType,
    q,
    ratingMode,
    ratingOp,
    ratingVal,
    tagFilterMode,
    tagIds,
  } = searchParams;

  const user = await resolveCurrentUserOrThrow();

  // 検索
  const { nodes: searched, total } = await searchFavoriteMediaNodes({
    userId: user.id,
    limit: APP_CONFIG.favorites.maxPageSize,
    sortKey: sort,
    sortDirection: direction,
    shuffle,
    seed,
    mediaType,
    query: q,
    ratingMode,
    ratingOp,
    ratingVal,
    tagFilterMode,
    tagIds,
  });

  // フォーマット
  const formatted = formatNodes(searched);

  const listing = {
    nodes: formatted,
    path: "",
    parent: null,
    prev: null,
    next: null,
    total,
  };

  const favorites = listing.nodes.map(
    (n) =>
      ({
        path: n.path,
        rating: n.rating,
        favoritedAt: n.favoritedAt,
      }) satisfies Favorite
  );

  const key = hashObject(searchParams);

  return (
    <PathSelectionProvider>
      <FavoritesControlProvider key={key} favorites={favorites}>
        <FavoritesProvider listing={listing}>
          <Favorites />
        </FavoritesProvider>
      </FavoritesControlProvider>
    </PathSelectionProvider>
  );
}
