import Explorer from "@/app/explorer/ui/explorer";
import { getMediaFsListing } from "@/app/lib/media/explorer";
import { notFound } from "next/navigation";

export default async function Page(props: {
  params: Promise<{ path: string[] }>;
}) {
  const { path: pathParts } = await props.params;

  // 配列の各要素をデコード
  const decodedParts = pathParts?.map((part) => decodeURIComponent(part)) ?? [];
  const p = decodedParts.join("/");

  const data = await getMediaFsListing(p);

  if (!data) notFound();

  return (
    <main>
      <Explorer data={data} />
    </main>
  );
}
