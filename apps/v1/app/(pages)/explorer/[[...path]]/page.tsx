import { USER } from "@/basic-auth";
import { Explorer } from "@/components/ui/explorer";
import { getMediaFsListing } from "@/lib/media/listing";
import { mergeFsWithDb } from "@/lib/media/merge";
import { getDbMedia } from "@/lib/media/repository";
import { sortMediaFsNodes } from "@/lib/media/sort";
import { notFound } from "next/navigation";

export default async function Page(props: {
  params: Promise<{ path?: string[] }>;
}) {
  const { path: pathParts = [] } = await props.params;
  const dirPath = pathParts.map(decodeURIComponent).join("/");

  const listing = await getMediaFsListing(dirPath);
  if (!listing) notFound();

  // TODO: ユーザー認証機能実装後に差し替える
  const dbMedia = await getDbMedia(dirPath, USER);

  // ソート + マージ
  const sorted = sortMediaFsNodes(listing.nodes);
  const merged = mergeFsWithDb(sorted, dbMedia);

  return (
    <Explorer
      listing={{
        ...listing,
        nodes: merged,
      }}
    />
  );
}
