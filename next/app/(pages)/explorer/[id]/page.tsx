import { NodeFavoriteProvider } from "@/__feature/favorite/providers/favorites-control-provider";
import { mergeDbNodes } from "@/__lib/node/merge";
import { syncFsWithDb } from "@/__lib/node/sync";
import { APP_CONFIG } from "@/app.config";
import { Explorer } from "@/app/(pages)/explorer/_components";
import { NodeListingProvider } from "@/feature/listing/providers/node-listing-provider";
import { MediaNode } from "@/feature/media-node/lib/types";
import { MediaNodesProvider } from "@/feature/media-node/providers/media-nodes-provider";
import { ViewerProvider } from "@/feature/viewer/providers/viewer-provider";
import { getCurrentUserOrThrow } from "@/lib/auth/current-user";
import { isMediaFile } from "@/lib/file/media-types";
import { getFiles } from "@/lib/file/repository";
import {
  createFoldersRecursively,
  getDbFolders,
  getFolder,
  getFolderName,
  getFolderPath,
  updateFolderCache,
} from "@/lib/folder/repository";
import { defaultFsContext, getFsListing } from "@/lib/fs/fs-listing";
import { Node, NodeListing } from "@/lib/node/types";
import { SortDirection, SortKey, sortNodes } from "@/lib/sort/sort-nodes";
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
  const user = await getCurrentUserOrThrow();

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
  const fsListing = await getFsListing(folderPath, defaultFsContext);

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
    ? await createFoldersRecursively(fsListing.nextPath)
    : null;

  const nextFolder = nextFolderId
    ? await getFolder(nextFolderId, user.id)
    : null;

  const prevFolderId = fsListing.prevPath
    ? await createFoldersRecursively(fsListing.prevPath)
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

  const favoriteNodes = listing.children
    .filter((n) => n.favoritedAt)
    .map((n) => ({
      id: n.id,
      isFavorite: !!n.favoritedAt,
    }));

  const mediaNodes = listing.children
    .filter((n) => !n.isDirectory)
    .filter((n): n is MediaNode => isMediaFile(n.type));

  return (
    <NodeListingProvider listing={listing}>
      <NodeFavoriteProvider nodes={favoriteNodes}>
        <ViewerProvider total={mediaNodes.length}>
          <MediaNodesProvider nodes={mediaNodes}>
            <Explorer />
          </MediaNodesProvider>
        </ViewerProvider>
      </NodeFavoriteProvider>
    </NodeListingProvider>
  );
}
