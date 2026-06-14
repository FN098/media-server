import { APP_CONFIG } from "@/app.config";
import { Explorer } from "@/feature/explorer";
import { ExplorerProvider } from "@/feature/explorer/providers/explorer-provider";
import { FavoritesControlProvider } from "@/feature/favorite/providers/favorites-control-provider";
import { PathSelectionProvider } from "@/feature/selection/providers/path-selection-provider";
import { resolveCurrentUserOrThrow } from "@/lib/auth/current-user";
import { Favorite } from "@/lib/favorite/types";
import {
  getFolderFavoriteInfo,
  getFolderMetas,
  getFolderVisitedInfo,
  updateFolderCache,
} from "@/lib/folder/repository";
import { formatNodes } from "@/lib/media/formatters";
import { getFsListing } from "@/lib/media/fs-listing";
import { mergeFsWithDb } from "@/lib/media/merger";
import { getMediaDbNodes } from "@/lib/media/repository";
import { SortDirection, SortKeyOf, sortNodes } from "@/lib/media/sort";
import { syncMediaDir } from "@/lib/media/sync";
import { MediaNode } from "@/lib/media/types";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { basename, extname } from "path";

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
  const fsListing = await getFsListing(currentVirtualPath);
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

  // フォルダメタデータ更新
  void updateFolderCache({
    path: currentVirtualPath,
    directFiles: fsNodes
      .filter((node) => !node.isDirectory)
      .map((n) => ({ fileSize: n.size ?? 0 })), // 現在のフォルダ直下のファイル群
    subFolderMetas: folderMetas, // 直下の子フォルダたちのメタ情報（すでにお互いの合計を持っている）
  });

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
    valueMapper: (node, key) => {
      if (node.isDirectory && key === "rating") {
        return node["averageRating"];
      }

      if (key === "name") {
        // 拡張子を除くファイル名で比較
        return basename(node.name, extname(node.name));
      }

      if (key === "path") {
        // 拡張子を除くファイル名で比較
        return basename(node.path, extname(node.path));
      }

      return node[key];
    },
  });

  // フォーマット
  const formatted = formatNodes(sorted);

  const listing = {
    ...fsListing,
    nodes: formatted,
  };

  const favorites = listing.nodes
    .filter((n) => n.favoritedAt)
    .map(
      (n) =>
        ({
          path: n.path,
          rating: n.rating,
          favoritedAt: n.favoritedAt,
        }) satisfies Favorite
    );

  return (
    <PathSelectionProvider>
      <FavoritesControlProvider favorites={favorites}>
        <ExplorerProvider listing={listing}>
          <Explorer />
        </ExplorerProvider>
      </FavoritesControlProvider>
    </PathSelectionProvider>
  );
}
