import Explorer from "@/app/dashboard/explorer/ui/explorer";
import { ExplorerHeader } from "@/app/dashboard/explorer/ui/header";
import { SearchProvider } from "@/app/dashboard/explorer/ui/providers/search-provider";
import { getMediaFsListing } from "@/app/lib/media/explorer";
import { createVideoThumbs } from "@/app/lib/media/thumb";
import { notFound } from "next/navigation";

export default async function Page(props: {
  params: Promise<{ path?: string[] }>;
}) {
  const { path: pathParts = [] } = await props.params;
  const decodedPath = pathParts.map(decodeURIComponent).join("/");

  const listing = await getMediaFsListing(decodedPath);
  if (!listing) notFound();

  // 動画サムネイルを自動生成
  await createVideoThumbs(listing.nodes);

  // 一つ上の階層のフォルダを先頭に追加
  if (listing?.parent !== null) {
    listing.nodes.unshift({
      name: "..",
      path: listing.parent,
      isDirectory: true,
      type: "directory",
      updatedAt: "",
    });
  }

  return (
    <SearchProvider>
      <ExplorerHeader />
      <Explorer listing={listing} />
    </SearchProvider>
  );
}
