import { NodeFavoriteProviderProps } from "@/__feature/favorite/providers/favorites-control-provider";
import { Trash } from "@/__feature/pages/trash";
import { TrashProvider } from "@/__feature/pages/trash/providers/trash-provider";
import { mergeDbNodes } from "@/__lib/node/merge";
import { getServerMediaTrashPath } from "@/__lib/path/helpers";
import { isSystemHiddenVirtualPath } from "@/__lib/path/protections";
import { APP_CONFIG } from "@/app.config";
import { SelectionProvider } from "@/feature/selection/providers/selection-provider";
import { SortDirection, SortKey, sortNodes } from "@/feature/sort/sort-nodes";
import { getCurrentUserOrThrow } from "@/lib/auth/current-user";
import { getFiles } from "@/lib/file/repository";
import { getVisitedFolders } from "@/lib/folder/repository";
import { getFsListing } from "@/lib/fs/fs-listing";
import { formatNodes } from "@/lib/node/formatters";
import { Node } from "@/lib/node/types";
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
    sort?: SortKey<Node>;
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
  const user = await getCurrentUserOrThrow();

  // DB クエリ
  const [dbNodes, folderVisited] = await Promise.all([
    getFiles(currentVirtualDirPath, user.id),
    getVisitedFolders(dirPaths, user.id),
  ]);

  // マージ
  const merged = mergeDbNodes({
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
    <SelectionProvider>
      <NodeFavoriteProviderProps nodes={listing.nodes}>
        <TrashProvider listing={listing}>
          <Trash />
        </TrashProvider>
      </NodeFavoriteProviderProps>
    </SelectionProvider>
  );
}
