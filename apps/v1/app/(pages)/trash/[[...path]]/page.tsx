import { APP_CONFIG } from "@/app.config";
import { USER } from "@/basic-auth";
import { Trash } from "@/components/ui/pages/trash";
import { FavoritesRecord } from "@/lib/favorite/types";
import { formatNodes } from "@/lib/media/format";
import { getMediaFsListing } from "@/lib/media/fs";
import { mergeFsWithDb } from "@/lib/media/merge";
import { SortKeyOf, sortMediaFsNodes, SortOrderOf } from "@/lib/media/sort";
import { syncMediaDir } from "@/lib/media/sync";
import { MediaFsNode } from "@/lib/media/types";
import { isBlockedVirtualPath } from "@/lib/path/blacklist";
import { getServerMediaTrashPath } from "@/lib/path/helpers";
import { FavoritesProvider } from "@/providers/favorites-provider";
import { PathSelectionProvider } from "@/providers/path-selection-provider";
import { TrashProvider } from "@/providers/trash-provider";
import {
  getDbFavoriteCount,
  getDbVisitedInfoDeeply,
} from "@/repositories/folder-repository";
import { getDbMedia } from "@/repositories/media-repository";
import { Metadata } from "next";
import { notFound } from "next/navigation";

// 動的ページとしてレンダリング
export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: TrashPageProps
): Promise<Metadata> {
  const { path: pathParts = [] } = await props.params;

  const lastPart = pathParts[pathParts.length - 1] ?? "HOME";
  const decodedPart = decodeURIComponent(lastPart);

  return {
    title: `${decodedPart} | ${APP_CONFIG.meta.title}`,
  };
}

interface TrashPageProps {
  params: Promise<{
    path?: string[];
    sort?: SortKeyOf<MediaFsNode>;
    order?: SortOrderOf<MediaFsNode>;
  }>;
}

export default async function TrashPage(props: TrashPageProps) {
  const {
    path: pathParts = [],
    sort: sortKey = "name",
    order: sortOrder = "asc",
  } = await props.params;

  const currentVirtualDirPath = pathParts.map(decodeURIComponent).join("/");

  // 取得
  const fsListing = await getMediaFsListing(currentVirtualDirPath, {
    resolveRealPath: (virtualPath) => getServerMediaTrashPath(virtualPath),
    filterVirtualPath: (virtualPath) => !isBlockedVirtualPath(virtualPath),
  });
  if (!fsListing) notFound();

  const allNodes = fsListing.nodes;

  // ソート
  const sorted = sortMediaFsNodes(allNodes, {
    key: sortKey,
    order: sortOrder,
  });

  const dirPaths = sorted.filter((e) => e.isDirectory).map((e) => e.path);

  // DB クエリ
  // TODO: ユーザー認証機能実装後に差し替える
  await syncMediaDir(currentVirtualDirPath, allNodes);
  const [dbMedia, dbVisited, dbFavorites] = await Promise.all([
    getDbMedia(currentVirtualDirPath, USER),
    getDbVisitedInfoDeeply(dirPaths, USER),
    getDbFavoriteCount(dirPaths, USER),
  ]);

  // マージ
  const merged = mergeFsWithDb(sorted, dbMedia, dbVisited, dbFavorites);

  // フォーマット
  const formatted = formatNodes(merged);

  // お気に入り
  const favorites: FavoritesRecord = Object.fromEntries(
    formatted.map((n) => [n.path, n.isFavorite])
  );

  const listing = {
    ...fsListing,
    nodes: formatted,
  };

  return (
    <TrashProvider listing={listing}>
      <FavoritesProvider favorites={favorites}>
        <PathSelectionProvider>
          <Trash />
        </PathSelectionProvider>
      </FavoritesProvider>
    </TrashProvider>
  );
}
