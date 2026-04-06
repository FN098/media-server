import { APP_CONFIG } from "@/app.config";
import { Favorites } from "@/components/ui/pages/favorites";
import { resolveCurrentUser } from "@/lib/auth/resolver";
import { formatNodes } from "@/lib/media/format";
import { SortKeyOf, sortMediaFsNodes, SortOrderOf } from "@/lib/media/sort";
import { MediaFsNode } from "@/lib/media/types";
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
  params: Promise<{
    sort?: SortKeyOf<MediaFsNode>;
    order?: SortOrderOf<MediaFsNode>;
  }>;
}

export default async function FavoritePage(props: FavoritePageProps) {
  const { sort: sortKey = "path", order: sortOrder = "asc" } =
    await props.params;

  const user = await resolveCurrentUser();

  // 取得
  const allNodes = await getFavoriteMediaNodes(user.id);

  // ソート
  const sorted = sortMediaFsNodes(allNodes, {
    key: sortKey,
    order: sortOrder,
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
