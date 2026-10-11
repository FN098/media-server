import { APP_CONFIG } from "@/app.config";
import { FavoritesControlProvider } from "@/feature/favorite/providers/favorites-control-provider";
import { Explorer } from "@/feature/pages/explorer";
import { ExplorerProvider } from "@/feature/pages/explorer/providers/explorer-provider";
import { PathSelectionProvider } from "@/feature/selection/providers/path-selection-provider";
import { resolveCurrentUserOrThrow } from "@/lib/auth/current-user";
import { Favorite } from "@/lib/favorite/types";
import { getDbFiles } from "@/lib/file/repository";
import {
  getDbFolders,
  getFolderNameById,
  getFolderPath,
  updateFolderCache,
} from "@/lib/folder/repository";
import { formatNodes } from "@/lib/node/formatters";
import { getFsListing } from "@/lib/node/fs-listing";
import { mergeDbNodes } from "@/lib/node/merge";
import { SortDirection, SortKey, sortNodes } from "@/lib/node/sort";
import { syncFsWithDb } from "@/lib/node/sync";
import { Node } from "@/lib/node/types";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { basename, extname } from "path";

interface ExplorerPageProps {
  // パスパラメータ: /explorer/[id]
  params: Promise<{
    id: string;
  }>;
  // URLクエリパラメータ: ?sort=name&direction=asc
  searchParams: Promise<{
    sort?: SortKey<Node>;
    direction?: SortDirection;
  }>;
}

export async function generateMetadata(
  props: ExplorerPageProps
): Promise<Metadata> {
  const { id } = await props.params;

  const name = id ? await getFolderNameById(id) : "HOME";

  return {
    title: `${name} | ${APP_CONFIG.meta.title}`,
  };
}

export default async function ExplorerPage(props: ExplorerPageProps) {
  const [params, searchParams] = await Promise.all([
    props.params,
    props.searchParams,
  ]);

  const { id: folderId } = params;
  const { sort: sortKey = "name", direction: sortDirection = "asc" } =
    searchParams;

  const folderPath = await getFolderPath(folderId);

  if (!folderPath) {
    notFound();
  }

  // FileSystem からリスト取得
  const fsListing = await getFsListing(folderPath);

  if (!fsListing) {
    notFound();
  }

  const fsNodes = fsListing.nodes;
  const user = await resolveCurrentUserOrThrow();

  // DBクエリの前にファイルシステムとDBの同期を取る（新規追加されたメディアをDBに反映）
  await syncFsWithDb(folderId, fsNodes);

  // DB クエリ
  const [dbFiles, dbFolders] = await Promise.all([
    getDbFiles(folderId, user.id),
    getDbFolders(folderId, user.id),
  ]);

  // フォルダキャッシュ更新
  void updateFolderCache(folderId, dbFiles, dbFolders);

  // マージ
  const merged = mergeDbNodes(dbFiles, dbFolders);

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
