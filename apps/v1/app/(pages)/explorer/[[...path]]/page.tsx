import { Explorer } from "@/components/ui/explorer";
import { getDbMedia, getMediaFsListing } from "@/lib/media/listing";
import { mergeFsWithDb } from "@/lib/media/merge";
import { withSortedNodes } from "@/lib/media/sort";
import { syncMediaDir } from "@/lib/media/sync";
import { createThumbsIfNotExists } from "@/lib/media/thumb";
import { notFound } from "next/navigation";

export default async function Page(props: {
  params: Promise<{ path?: string[] }>;
}) {
  const { path: pathParts = [] } = await props.params;
  const dirPath = pathParts.map(decodeURIComponent).join("/");

  const listing = await getMediaFsListing(dirPath);
  if (!listing) notFound();

  const dbMedia = await getDbMedia(dirPath);

  // 並列で副作用系を実行
  Promise.all([
    syncMediaDir(dirPath, listing.nodes),
    createThumbsIfNotExists(listing.nodes),
  ]).catch((e) => {
    console.error(e);
  });

  // ソート + マージ
  const sortedListing = withSortedNodes(listing);
  const mediaListing = mergeFsWithDb(sortedListing, dbMedia);

  return <Explorer listing={mediaListing} />;
}
