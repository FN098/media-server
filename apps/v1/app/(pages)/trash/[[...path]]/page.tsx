import { APP_CONFIG } from "@/app.config";
import { Trash } from "@/components/ui/pages/trash";
import { resolveCurrentUser } from "@/lib/auth/resolver";
import { formatNodes } from "@/lib/media/format";
import { getMediaFsListing } from "@/lib/media/fs";
import { mergeFsWithDb } from "@/lib/media/merge";
import { SortDirection, SortKeyOf, sortNodes } from "@/lib/media/sort";
import { MediaNode } from "@/lib/media/types";
import { isBlockedVirtualPath } from "@/lib/path/blacklist";
import { getServerMediaTrashPath } from "@/lib/path/helpers";
import { FavoritesProvider } from "@/providers/favorites-provider";
import { PathSelectionProvider } from "@/providers/path-selection-provider";
import { TrashProvider } from "@/providers/trash-provider";
import { getDbVisitedInfoDeeply } from "@/repositories/folder-repository";
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
  // パスパラメータ: /trash/[...path]
  params: Promise<{
    path?: string[];
  }>;
  // URLクエリパラメータ: ?sort=name&direction=asc
  searchParams: Promise<{
    sort?: SortKeyOf<MediaNode>;
    direction?: SortDirection;
  }>;
}

export default async function TrashPage(props: TrashPageProps) {
  const [params, searchParams] = await Promise.all([
    props.params,
    props.searchParams,
  ]);

  const { path: pathParts = [] } = params;
  const { sort: sortKey = "name", direction: sortDirection = "asc" } =
    searchParams;

  const currentVirtualDirPath = pathParts.map(decodeURIComponent).join("/");

  // 取得
  const fsListing = await getMediaFsListing(currentVirtualDirPath, {
    resolveRealPath: (virtualPath) => getServerMediaTrashPath(virtualPath),
    filterVirtualPath: (virtualPath) => !isBlockedVirtualPath(virtualPath),
  });
  if (!fsListing) notFound();

  const allNodes = fsListing.nodes;

  const dirPaths = allNodes.filter((e) => e.isDirectory).map((e) => e.path);

  const user = await resolveCurrentUser();

  // DB クエリ
  const [dbMedia, dbVisited] = await Promise.all([
    getDbMedia(currentVirtualDirPath, user.id),
    getDbVisitedInfoDeeply(dirPaths, user.id),
  ]);

  // マージ
  const merged = mergeFsWithDb({
    fsMedia: allNodes,
    dbMedia,
    dbVisited,
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
    nodes: formatted.map((n) => ({
      ...n,
      isDeleted: true,
    })),
  };

  return (
    <TrashProvider listing={listing}>
      <FavoritesProvider favorites={listing.nodes}>
        <PathSelectionProvider>
          <Trash />
        </PathSelectionProvider>
      </FavoritesProvider>
    </TrashProvider>
  );
}
