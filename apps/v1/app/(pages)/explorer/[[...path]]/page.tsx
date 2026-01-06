import { APP_CONFIG } from "@/app.config";
import { USER } from "@/basic-auth";
import { Explorer } from "@/components/ui/pages/explorer";
import { formatNodes } from "@/lib/media/format";
import { getMediaFsListing } from "@/lib/media/fs";
import { mergeFsWithDb } from "@/lib/media/merge";
import { SortKeyOf, sortMediaFsNodes, SortOrderOf } from "@/lib/media/sort";
import { syncMediaDir } from "@/lib/media/sync";
import { MediaFsNode } from "@/lib/media/types";
import { ExplorerProvider } from "@/providers/explorer-provider";
import { PathSelectionProvider } from "@/providers/path-selection-provider";
import {
  getDbFavoriteCount,
  getDbVisitedInfoDeeply,
} from "@/repositories/folder-repository";
import { getDbMedia } from "@/repositories/media-repository";
import { Metadata } from "next";
import { cacheTag } from "next/cache";
import { notFound } from "next/navigation";

interface ExplorerPageProps {
  params: Promise<{
    path?: string[];
    sort?: SortKeyOf<MediaFsNode>;
    order?: SortOrderOf<MediaFsNode>;
  }>;
}

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

async function getCachedDbMedia(dirPath: string, userId: string) {
  "use cache";
  cacheTag("media", "tags", "favorites");
  return getDbMedia(dirPath, userId);
}

async function getCachedDbFavoriteCount(dirPaths: string[], userId: string) {
  "use cache";
  cacheTag("favorites");
  return getDbFavoriteCount(dirPaths, userId);
}

async function getCachedDbVisitedInfoDeeply(
  dirPaths: string[],
  userId: string
) {
  "use cache";
  cacheTag("folders");
  return getDbVisitedInfoDeeply(dirPaths, userId);
}

export default async function Page(props: ExplorerPageProps) {
  const {
    path: pathParts = [],
    sort: sortKey = "name",
    order: sortOrder = "asc",
  } = await props.params;

  // TODO: ユーザー認証機能実装後に差し替える
  const userId = USER;

  const currentDirPath = pathParts.map(decodeURIComponent).join("/");

  // 取得
  const fsListing = await getMediaFsListing(currentDirPath);
  if (!fsListing) notFound();

  const allNodes = fsListing.nodes;

  // ソート
  const sorted = sortMediaFsNodes(allNodes, {
    key: sortKey,
    order: sortOrder,
  });

  const dirPaths = sorted.filter((e) => e.isDirectory).map((e) => e.path);

  await syncMediaDir(currentDirPath, allNodes); // TODO: クローラーワーカージョブに移動

  // DB クエリ
  const [dbMedia, dbVisited, dbFavorites] = await Promise.all([
    getCachedDbMedia(currentDirPath, userId),
    getCachedDbVisitedInfoDeeply(dirPaths, userId),
    getCachedDbFavoriteCount(dirPaths, userId),
  ]);

  // マージ
  const merged = mergeFsWithDb(sorted, dbMedia, dbVisited, dbFavorites);

  // フォーマット
  const formatted = formatNodes(merged);

  const listing = {
    ...fsListing,
    nodes: formatted,
  };

  return (
    <ExplorerProvider listing={listing}>
      <PathSelectionProvider>
        <Explorer />
      </PathSelectionProvider>
    </ExplorerProvider>
  );
}
