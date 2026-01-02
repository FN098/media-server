import { APP_CONFIG } from "@/app.config";
import { USER } from "@/basic-auth";
import { Explorer } from "@/components/ui/explorer";
import { formatNodes } from "@/lib/media/format";
import { getMediaFsListing } from "@/lib/media/fs";
import { mergeFsWithDb } from "@/lib/media/merge";
import { SortKeyOf, sortMediaFsNodes, SortOrderOf } from "@/lib/media/sort";
import { syncMediaDir } from "@/lib/media/sync";
import { MediaFsNode } from "@/lib/media/types";
import { ExplorerListingProvider } from "@/providers/explorer-listing-provider";
import { ExplorerNavigationProvider } from "@/providers/explorer-navigation-provider";
import { FavoritesProvider } from "@/providers/favorites-provider";
import { SelectionProvider } from "@/providers/selection-provider";
import {
  getDbFavoriteCount,
  getDbVisitedInfoDeeply,
} from "@/repositories/folder-repository";
import { getDbMedia, getDbMediaCount } from "@/repositories/media-repository";
import { Metadata } from "next";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    path?: string[];
    sort?: SortKeyOf<MediaFsNode>;
    order?: SortOrderOf<MediaFsNode>;
  }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { path: pathParts = [] } = await props.params;

  const lastPart = pathParts[pathParts.length - 1];
  const decodedPart = decodeURIComponent(lastPart);

  return {
    title: `${decodedPart} | ${APP_CONFIG.meta.title}`,
  };
}

export default async function Page(props: Props) {
  const {
    path: pathParts = [],
    sort: sortKey = "name",
    order: sortOrder = "asc",
  } = await props.params;

  const currentDirPath = pathParts.map(decodeURIComponent).join("/");

  // 取得
  const listing = await getMediaFsListing(currentDirPath);
  if (!listing) notFound();

  const rawNodes = listing.nodes;

  // ソート
  const sorted = sortMediaFsNodes(rawNodes, {
    key: sortKey,
    order: sortOrder,
  });

  const dirPaths = sorted.filter((e) => e.isDirectory).map((e) => e.path);

  // DB の件数を先に取得し、一致しなければ同期
  const dbCount = await getDbMediaCount(currentDirPath);
  if (dbCount !== rawNodes.length) {
    await syncMediaDir(currentDirPath, rawNodes);
  }

  // DB クエリ
  // TODO: ユーザー認証機能実装後に差し替える
  const dbMedia = await getDbMedia(currentDirPath, USER);
  const dbVisited = await getDbVisitedInfoDeeply(dirPaths, USER);
  const dbFavorites = await getDbFavoriteCount(dirPaths, USER);

  // マージ
  const merged = mergeFsWithDb(sorted, dbMedia, dbVisited, dbFavorites);

  // フォーマット
  const formatted = formatNodes(merged);

  const finalListing = {
    ...listing,
    nodes: formatted,
  };

  return (
    <SelectionProvider>
      <FavoritesProvider>
        <ExplorerListingProvider listing={finalListing}>
          <ExplorerNavigationProvider>
            <Explorer />
          </ExplorerNavigationProvider>
        </ExplorerListingProvider>
      </FavoritesProvider>
    </SelectionProvider>
  );
}
