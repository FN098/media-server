import { APP_CONFIG } from "@/app.config";
import { Favorites } from "@/components/ui/pages/favorites";
import { resolveCurrentUserOrThrow } from "@/lib/auth/resolver";
import { searchFavoriteMediaNodes } from "@/lib/favorite/search";
import { FavoriteSortKey } from "@/lib/favorite/types";
import { formatNodes } from "@/lib/media/format";
import { MediaType } from "@/lib/media/types";
import { hashObject } from "@/lib/utils/hash";
import { ExplorerProvider } from "@/providers/explorer-provider";
import { FavoritesProvider } from "@/providers/favorites-provider";
import { PathSelectionProvider } from "@/providers/path-selection-provider";
import { Metadata } from "next";

// 動的ページとしてレンダリング
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Favorites | ${APP_CONFIG.meta.title}`,
};

interface FavoritePageProps {
  // URLクエリパラメータ: ?sort=name&direction=asc
  searchParams: Promise<{
    page?: number;
    sort?: string;
    direction?: "asc" | "desc";
    shuffle?: boolean;
    seed?: string;
    mediaType?: MediaType;
    q?: string;
    ratingMode?: "all" | "unrated" | "rated";
    ratingOp?: "gte" | "lte" | "eq" | "between";
    ratingVal?: string; // 1~5 の数値 or {min},{max}
    tagIds?: string; // カンマ区切り
  }>;
}

export default async function FavoritePage(props: FavoritePageProps) {
  const [searchParams] = await Promise.all([props.searchParams]);

  const {
    sort: sortKey = "favoritedAt",
    direction: sortDirection = "desc",
    shuffle,
    seed,
    mediaType,
    q: query,
    ratingMode,
    ratingOp,
    ratingVal,
    tagIds,
  } = searchParams;

  const user = await resolveCurrentUserOrThrow();

  // 検索
  const favoriteNodes = await searchFavoriteMediaNodes({
    userId: user.id,
    sortKey: sortKey as FavoriteSortKey,
    sortDirection,
    shuffle,
    seed,
    mediaType,
    query,
    ratingMode,
    ratingOp,
    ratingVal,
    tagIds,
  });

  // フォーマット
  const formatted = formatNodes(favoriteNodes);

  const listing = {
    nodes: formatted,
    path: "",
    parent: null,
    prev: null,
    next: null,
  };

  const key = hashObject(searchParams);

  return (
    <ExplorerProvider listing={listing}>
      <FavoritesProvider key={key} favorites={favoriteNodes}>
        <PathSelectionProvider>
          <Favorites />
        </PathSelectionProvider>
      </FavoritesProvider>
    </ExplorerProvider>
  );
}
