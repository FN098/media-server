import { APP_CONFIG } from "@/app.config";
import { Explorer } from "@/components/ui/pages/explorer";
import { resolveCurrentUserOrThrow } from "@/lib/auth/resolver";
import { formatNodes } from "@/lib/media/format";
import { getMediaFsListing } from "@/lib/media/fs";
import { mergeFsWithDb } from "@/lib/media/merge";
import { sortNodes } from "@/lib/media/sort";
import { syncMediaDir } from "@/lib/media/sync";
import { MediaNode, SortDirection, SortKeyOf } from "@/lib/media/types";
import { FavoritesProvider } from "@/providers/favorites-provider";
import { PathSelectionProvider } from "@/providers/path-selection-provider";
import {
  getFolderFavoriteInfo,
  getFolderMetas,
  getFolderVisitedInfo,
} from "@/repositories/folder-repository";
import { getMediaDbNodes } from "@/repositories/media-repository";
import { Metadata } from "next";
import { notFound } from "next/navigation";

// 動的ページとしてレンダリング
export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: ExplorerPageProps
): Promise<Metadata> {
  const { path: pathParts = [] } = await props.params;

  const lastPart = pathParts[pathParts.length - 1] ?? "HOME";
  const decodedPart = decodeURIComponent(lastPart);

  return {
    title: `${decodedPart} | ${APP_CONFIG.meta.title}`,
  };
}

interface ExplorerPageProps {
  // パスパラメータ: /explorer/[...path]
  params: Promise<{
    path?: string[];
  }>;
  // URLクエリパラメータ: ?sort=name&direction=asc
  searchParams: Promise<{
    sort?: SortKeyOf<MediaNode>;
    direction?: SortDirection;
  }>;
}

export default async function ExplorerPage(props: ExplorerPageProps) {
  const [params, searchParams] = await Promise.all([
    props.params,
    props.searchParams,
  ]);

  const { path: pathParts = [] } = params;
  const { sort: sortKey = "name", direction: sortDirection = "asc" } =
    searchParams;

  const currentVirtualPath = pathParts.map(decodeURIComponent).join("/");

  // FileSystem からリスト取得
  const fsListing = await getMediaFsListing(currentVirtualPath);
  if (!fsListing) notFound();

  const fsNodes = fsListing.nodes;
  const dirPaths = fsNodes.filter((e) => e.isDirectory).map((e) => e.path);
  const user = await resolveCurrentUserOrThrow();

  // DBクエリの前にファイルシステムとDBの同期を取る（新規追加されたメディアをDBに反映）
  await syncMediaDir(currentVirtualPath, fsNodes);

  // DB クエリ
  const [dbNodes, folderVisited, folderFavorites, folderMetas] =
    await Promise.all([
      getMediaDbNodes(currentVirtualPath, user.id),
      getFolderVisitedInfo(dirPaths, user.id),
      getFolderFavoriteInfo(dirPaths, user.id),
      getFolderMetas(dirPaths),
    ]);

  // マージ
  const merged = mergeFsWithDb({
    fsNodes,
    dbNodes,
    folderVisited,
    folderFavorites,
    folderMetas,
  });

  // ソート
  const sorted = sortNodes(merged, {
    key: sortKey,
    direction: sortDirection,
  });

  // フォーマット
  const formatted = formatNodes(sorted);

  const listing = {
    ...fsListing,
    nodes: formatted,
  };

  return (
    <FavoritesProvider favorites={listing.nodes}>
      <PathSelectionProvider>
        <Explorer listing={listing} />
      </PathSelectionProvider>
    </FavoritesProvider>
  );
}
