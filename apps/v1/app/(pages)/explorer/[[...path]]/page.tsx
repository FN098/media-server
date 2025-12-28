import { USER } from "@/basic-auth";
import { Explorer } from "@/components/ui/explorer";
import { getDbFolders } from "@/lib/folder/repository";
import { getMediaFsListing } from "@/lib/media/fs";
import { mergeFsWithDb } from "@/lib/media/merge";
import { getDbMedia } from "@/lib/media/repository";
import { sortMediaFsNodes, SortOptions } from "@/lib/media/sort";
import { MediaFsNode } from "@/lib/media/types";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function Page(props: {
  params: Promise<{
    path?: string[];
    sort?: SortOptions<MediaFsNode>["key"];
    order?: SortOptions<MediaFsNode>["order"];
  }>;
}) {
  const {
    path: pathParts = [],
    sort: sortKey = "name",
    order: sortOrder = "asc",
  } = await props.params;

  const dirPath = pathParts.map(decodeURIComponent).join("/");

  // 取得
  const listing = await getMediaFsListing(dirPath);
  if (!listing) notFound();

  // ソート
  const sorted = sortMediaFsNodes(listing.nodes, {
    key: sortKey,
    order: sortOrder,
  });

  // TODO: ユーザー認証機能実装後に差し替える
  const dbMedia = await getDbMedia(dirPath, USER);
  const dirPaths = listing.nodes
    .filter((e) => e.isDirectory)
    .map((e) => e.path);
  const dbFolders = await getDbFolders(dirPaths, USER);

  // マージ
  const merged = mergeFsWithDb(sorted, dbMedia, dbFolders);

  return (
    <Explorer
      listing={{
        ...listing,
        nodes: merged,
      }}
    />
  );
}
