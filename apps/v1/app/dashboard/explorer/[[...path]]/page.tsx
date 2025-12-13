import { Explorer } from "@/app/components/ui/explorer";
import { getMediaFsListing } from "@/app/lib/explorer";
import { createThumbs } from "@/app/lib/thumb";
import { notFound } from "next/navigation";

export default async function Page(props: {
  params: Promise<{ path?: string[] }>;
}) {
  const { path: pathParts = [] } = await props.params;
  const decodedPath = pathParts.map(decodeURIComponent).join("/");

  const listing = await getMediaFsListing(decodedPath);
  if (!listing) notFound();

  // サムネイルを自動生成
  await createThumbs(listing.nodes);

  return <Explorer listing={listing} />;
}
