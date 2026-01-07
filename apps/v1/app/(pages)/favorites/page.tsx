import { APP_CONFIG } from "@/app.config";
import { USER } from "@/basic-auth";
import { FavoritesExplorer } from "@/components/ui/pages/favorites";
import { formatNodes } from "@/lib/media/format";
import { SortKeyOf, sortMediaFsNodes, SortOrderOf } from "@/lib/media/sort";
import { MediaFsNode } from "@/lib/media/types";
import { ExplorerProvider } from "@/providers/explorer-provider";
import { PathSelectionProvider } from "@/providers/path-selection-provider";
import { getFavoriteMediaNodes } from "@/repositories/media-repository";
import { Metadata } from "next";

interface FavoritePageProps {
  params: Promise<{
    sort?: SortKeyOf<MediaFsNode>;
    order?: SortOrderOf<MediaFsNode>;
  }>;
}

// 動的ページとしてレンダリング
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Favorites | ${APP_CONFIG.meta.title}`,
};

export default async function Page(props: FavoritePageProps) {
  const { sort: sortKey = "path", order: sortOrder = "asc" } =
    await props.params;

  // TODO: ユーザー認証機能実装後に差し替える
  // 取得
  const allNodes = await getFavoriteMediaNodes(USER);

  // ソート
  const sorted = sortMediaFsNodes(allNodes, {
    key: sortKey,
    order: sortOrder,
  });

  // フォーマット
  const formatted = formatNodes(sorted);

  const listing = {
    nodes: formatted.slice(0, 200), // TODO: 検証用
    // nodes: formatted,
    path: "",
    parent: null,
    prev: null,
    next: null,
  };

  return (
    <ExplorerProvider listing={listing}>
      <PathSelectionProvider>
        <FavoritesExplorer />
      </PathSelectionProvider>
    </ExplorerProvider>
  );
}
