import { APP_CONFIG } from "@/app.config";
import { Favorites } from "@/components/ui/pages/favorites";
import { resolveCurrentUserOrThrow } from "@/lib/auth/resolver";
import { formatNodes } from "@/lib/media/format";
import { SortDirection, SortKeyOf, sortNodes } from "@/lib/media/sort";
import { MediaNode } from "@/lib/media/types";
import { ExplorerProvider } from "@/providers/explorer-provider";
import { FavoritesProvider } from "@/providers/favorites-provider";
import { PathSelectionProvider } from "@/providers/path-selection-provider";
import { getFavoriteMediaNodes } from "@/repositories/media-repository";
import { Metadata } from "next";

// 動的ページとしてレンダリング
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Favorites | ${APP_CONFIG.meta.title}`,
};

interface FavoritePageProps {
  // URLクエリパラメータ: ?sort=name&direction=asc
  searchParams: Promise<{
    sort?: SortKeyOf<MediaNode>;
    direction?: SortDirection;
    seed?: string;
  }>;
}

export default async function FavoritePage(props: FavoritePageProps) {
  const [searchParams] = await Promise.all([props.searchParams]);

  const {
    sort: sortKey = "favoritedAt",
    direction: sortDirection = "desc",
    seed,
  } = searchParams;

  const user = await resolveCurrentUserOrThrow();

  // 取得
  const allNodes = await getFavoriteMediaNodes(user.id);

  // ソート
  const sorted = sortNodes(allNodes, {
    key: sortKey,
    direction: sortDirection,
    seed,
  });

  // フォーマット
  const formatted = formatNodes(sorted);

  const listing = {
    nodes: formatted,
    path: "",
    parent: null,
    prev: null,
    next: null,
  };

  return (
    <ExplorerProvider listing={listing}>
      <FavoritesProvider favorites={listing.nodes}>
        <PathSelectionProvider>
          <Favorites />
        </PathSelectionProvider>
      </FavoritesProvider>
    </ExplorerProvider>
  );
}
