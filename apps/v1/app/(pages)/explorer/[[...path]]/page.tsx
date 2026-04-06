import { APP_CONFIG } from "@/app.config";
import { Explorer } from "@/components/ui/pages/explorer";
import { resolveCurrentUser } from "@/lib/auth/resolver";
import { formatNodes } from "@/lib/media/format";
import { getMediaFsListing } from "@/lib/media/fs";
import { mergeFsWithDb } from "@/lib/media/merge";
import { SortKeyOf, sortMediaFsNodes, SortOrderOf } from "@/lib/media/sort";
import { syncMediaDir } from "@/lib/media/sync";
import { MediaFsNode } from "@/lib/media/types";
import { ExplorerProvider } from "@/providers/explorer-provider";
import { FavoritesProvider } from "@/providers/favorites-provider";
import { PathSelectionProvider } from "@/providers/path-selection-provider";
import {
  getDbFavoriteCount,
  getDbFolderMetas,
  getDbVisitedInfoDeeply,
  upsertFolderMetas,
} from "@/repositories/folder-repository";
import { getDbMedia } from "@/repositories/media-repository";
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
  params: Promise<{
    path?: string[];
    sort?: SortKeyOf<MediaFsNode>;
    order?: SortOrderOf<MediaFsNode>;
  }>;
}

export default async function ExplorerPage(props: ExplorerPageProps) {
  const {
    path: pathParts = [],
    sort: sortKey = "name",
    order: sortOrder = "asc",
  } = await props.params;

  const currentVirtualPath = pathParts.map(decodeURIComponent).join("/");

  // 取得
  const fsListing = await getMediaFsListing(currentVirtualPath);
  if (!fsListing) notFound();

  const allNodes = fsListing.nodes;

  // ソート
  const sorted = sortMediaFsNodes(allNodes, {
    key: sortKey,
    order: sortOrder,
  });

  // 今開いている「このフォルダ」自体のプレビューを決定
  // ソート済みノードから最初に見つかった画像/動画をこのフォルダの顔にする
  const firstMedia = sorted.find(
    (n) => !n.isDirectory && (n.type === "image" || n.type === "video")
  );

  if (firstMedia) {
    // currentVirtualPath がこのディレクトリ自体のパス
    void upsertFolderMetas([
      {
        path: currentVirtualPath,
        previewPath: firstMedia.path,
      },
    ]).catch(console.error);
    // ※ await せずに流しっぱなしでも、次にこの親ディレクトリに戻った時には DB に反映されている
  }

  const dirPaths = sorted.filter((e) => e.isDirectory).map((e) => e.path);
  const user = await resolveCurrentUser();

  // DBクエリの前にファイルシステムとDBの同期を取る（新規追加されたメディアをDBに反映）
  await syncMediaDir(currentVirtualPath, allNodes);

  // DB クエリ
  const [dbMedia, dbVisited, dbFavorites, dbFolderMetas] = await Promise.all([
    getDbMedia(currentVirtualPath, user.id),
    getDbVisitedInfoDeeply(dirPaths, user.id),
    getDbFavoriteCount(dirPaths, user.id),
    getDbFolderMetas(dirPaths),
  ]);

  // マージ
  const merged = mergeFsWithDb({
    fsMedia: sorted,
    dbMedia,
    dbVisited,
    dbFavorites,
    dbFolderMetas,
  });

  // フォーマット
  const formatted = formatNodes(merged);

  const listing = {
    ...fsListing,
    nodes: formatted,
  };

  return (
    <ExplorerProvider listing={listing}>
      <FavoritesProvider favorites={listing.nodes}>
        <PathSelectionProvider>
          <Explorer />
        </PathSelectionProvider>
      </FavoritesProvider>
    </ExplorerProvider>
  );
}
