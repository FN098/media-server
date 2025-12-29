import { APP_CONFIG } from "@/app.config";
import { USER } from "@/basic-auth";
import { Explorer } from "@/components/ui/explorer";
import { getDbFavoriteCount, getDbVisitedInfo } from "@/lib/folder/repository";
import { getMediaFsListing } from "@/lib/media/fs";
import { mergeFsWithDb } from "@/lib/media/merge";
import { getDbMedia } from "@/lib/media/repository";
import { sortMediaFsNodes, SortOptions } from "@/lib/media/sort";
import { MediaFsNode } from "@/lib/media/types";
import { Metadata } from "next";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    path?: string[];
    sort?: SortOptions<MediaFsNode>["key"];
    order?: SortOptions<MediaFsNode>["order"];
  }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { path: pathParts = [] } = await props.params;

  const last = pathParts[pathParts.length - 1];
  const decoded = decodeURIComponent(last);

  return {
    title: `${decoded} | ${APP_CONFIG.meta.title}`,
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

  // ソート
  const sorted = sortMediaFsNodes(listing.nodes, {
    key: sortKey,
    order: sortOrder,
  });

  // DB クエリ
  // TODO: ユーザー認証機能実装後に差し替える
  const dbMedia = await getDbMedia(currentDirPath, USER);

  const dirPaths = listing.nodes
    .filter((e) => e.isDirectory)
    .map((e) => e.path);

  const dbVisited = await getDbVisitedInfo(dirPaths, USER);
  const dbFavorites = await getDbFavoriteCount(dirPaths, USER);

  // マージ
  const merged = mergeFsWithDb(sorted, dbMedia, dbVisited, dbFavorites);

  return (
    <Explorer
      listing={{
        ...listing,
        nodes: merged,
      }}
    />
  );
}
