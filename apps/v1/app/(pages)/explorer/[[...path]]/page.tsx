import { Explorer } from "@/components/ui/explorer";
import { getMediaFsListing } from "@/lib/media/listing";
import { withSortedNodes } from "@/lib/media/sort";
import { syncMediaDir } from "@/lib/media/sync";
import { createThumbsIfNotExists } from "@/lib/media/thumb";
import { notFound } from "next/navigation";

export default async function Page(props: {
  params: Promise<{ path?: string[] }>;
}) {
  const { path: pathParts = [] } = await props.params;
  const decodedPath = pathParts.map(decodeURIComponent).join("/");

  const listing = await getMediaFsListing(decodedPath);
  if (!listing) notFound();

  await syncMediaDir(decodedPath, listing.nodes);

  const sortedListing = withSortedNodes(listing);

  // サムネイルを自動生成
  await createThumbsIfNotExists(listing.nodes);

  return <Explorer listing={sortedListing} />;
}
