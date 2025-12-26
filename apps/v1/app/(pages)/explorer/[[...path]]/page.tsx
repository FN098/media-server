import { USER } from "@/basic-auth";
import { Explorer } from "@/components/ui/explorer";
import { visitFolder } from "@/lib/folder/visit";
import { getMediaFsListing } from "@/lib/media/listing";
import { mergeFsWithDb } from "@/lib/media/merge";
import { getDbMedia } from "@/lib/media/repository";
import { sortMediaFsNodes } from "@/lib/media/sort";
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

  // TODO: ユーザー認証機能実装後に差し替える
  const dbMedia = await getDbMedia(dirPath, USER);

  // 並列で副作用系を実行
  Promise.all([
    syncMediaDir(dirPath, listing.nodes),
    createThumbsIfNotExists(listing.nodes),
  ]).catch((e) => {
    console.error(e);
  });

  // ソート + マージ
  const sorted = sortMediaFsNodes(listing.nodes);
  const merged = mergeFsWithDb(sorted, dbMedia);

  await visitFolder(dirPath, USER);

  return (
    <Explorer
      listing={{
        ...listing,
        nodes: merged,
      }}
    />
  );
}
