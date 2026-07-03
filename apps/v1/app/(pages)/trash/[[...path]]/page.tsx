import { APP_CONFIG } from "@/app.config";
import { FavoritesControlProvider } from "@/feature/favorite/providers/favorites-control-provider";
import { Trash } from "@/feature/pages/trash";
import { TrashProvider } from "@/feature/pages/trash/providers/trash-provider";
import { PathSelectionProvider } from "@/feature/selection/providers/path-selection-provider";
import { resolveCurrentUserOrThrow } from "@/lib/auth/current-user";
import { getFolderVisitedInfo } from "@/lib/folder/repository";
import { formatNodes } from "@/lib/media/formatters";
import { getFsListing } from "@/lib/media/fs-listing";
import { mergeFsWithDb } from "@/lib/media/merger";
import { getMediaDbNodes } from "@/lib/media/repository";
import { SortDirection, SortKeyOf, sortNodes } from "@/lib/media/sort";
import { MediaNode } from "@/lib/media/types";
import { getServerMediaTrashPath } from "@/lib/path/helpers";
import { isSystemHiddenVirtualPath } from "@/lib/path/protections";
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

  // FileSystem からリスト取得
  const fsListing = await getFsListing(currentVirtualDirPath, {
    resolveRealPath: (virtualPath) => getServerMediaTrashPath(virtualPath),
    filterVirtualPath: (virtualPath) => !isSystemHiddenVirtualPath(virtualPath),
  });
  if (!fsListing) notFound();

  const fsNodes = fsListing.nodes;
  const dirPaths = fsNodes.filter((e) => e.isDirectory).map((e) => e.path);
  const user = await resolveCurrentUserOrThrow();

  // DB クエリ
  const [dbNodes, folderVisited] = await Promise.all([
    getMediaDbNodes(currentVirtualDirPath, user.id),
    getFolderVisitedInfo(dirPaths, user.id),
  ]);

  // マージ
  const merged = mergeFsWithDb({
    fsNodes,
    dbNodes,
    folderVisited,
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
    <PathSelectionProvider>
      <FavoritesControlProvider favorites={listing.nodes}>
        <TrashProvider listing={listing}>
          <Trash />
        </TrashProvider>
      </FavoritesControlProvider>
    </PathSelectionProvider>
  );
}
