import { APP_CONFIG } from "@/app.config";
import { FavoritesControlProvider } from "@/feature/favorite/providers/favorites-control-provider";
import { Explorer } from "@/feature/pages/explorer";
import { ExplorerProvider } from "@/feature/pages/explorer/providers/explorer-provider";
import { NodeSelectionProvider } from "@/feature/selection/providers/node-selection-provider";
import { resolveCurrentUserOrThrow } from "@/lib/auth/current-user";
import { getFiles } from "@/lib/file/repository";
import {
  createFolders,
  getDbFolders,
  getFolder,
  getFolderName,
  getFolderPath,
  updateFolderCache,
} from "@/lib/folder/repository";
import { getFsListing } from "@/lib/node/fs-listing";
import { mergeDbNodes } from "@/lib/node/merge";
import { SortDirection, SortKey, sortNodes } from "@/lib/node/sort";
import { syncFsWithDb } from "@/lib/node/sync";
import { Node, NodeListing } from "@/lib/node/types";
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

  const name = id ? await getFolderName(id) : "HOME";

  return {
    title: `${name} | ${APP_CONFIG.meta.title}`,
  };
}

export default async function ExplorerPage(props: ExplorerPageProps) {
  const user = await resolveCurrentUserOrThrow();

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

  // DBクエリの前にファイルシステムとDBの同期を取る（新規追加されたメディアをDBに反映）
  await syncFsWithDb(folderId, fsNodes);

  // DB クエリ
  const [dbFiles, dbFolders] = await Promise.all([
    getFiles(folderId, user.id),
    getDbFolders(folderId, user.id),
  ]);

  // フォルダキャッシュ更新
  await updateFolderCache(folderId, dbFiles, dbFolders);

  // マージ
  const merged = mergeDbNodes(dbFiles, dbFolders);

  // ソート
  const sorted = sortNodes(merged, {
    key: sortKey,
    direction: sortDirection,
    valueMapper: (node, key) => {
      if (key === "name") {
        // 拡張子を除くファイル名で比較
        return basename(node.name, extname(node.name));
      }

      return node[key];
    },
  });

  const currentFolder = await getFolder(folderId, user.id);

  if (!currentFolder) {
    notFound();
  }

  const parentFolder = currentFolder.parentFolderId
    ? await getFolder(currentFolder.parentFolderId, user.id)
    : null;

  const nextFolderId = fsListing.nextPath
    ? await createFolders(fsListing.nextPath)
    : null;

  const nextFolder = nextFolderId
    ? await getFolder(nextFolderId, user.id)
    : null;

  const prevFolderId = fsListing.prevPath
    ? await createFolders(fsListing.prevPath)
    : null;

  const prevFolder = prevFolderId
    ? await getFolder(prevFolderId, user.id)
    : null;

  const listing: NodeListing = {
    currentFolder,
    parentFolder,
    nextFolder,
    prevFolder,
    children: sorted,
  };

  const favorites = listing.children
    .filter((n) => n.favoritedAt)
    .map((n) => ({
      id: n.id,
      isFavorite: !!n.favoritedAt,
    }));

  return (
    <NodeSelectionProvider>
      <FavoritesControlProvider entries={favorites}>
        <ExplorerProvider listing={listing}>
          <Explorer />
        </ExplorerProvider>
      </FavoritesControlProvider>
    </NodeSelectionProvider>
  );
}
