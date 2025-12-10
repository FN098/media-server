import Explorer from "@/app/explorer/ui/explorer";
import { getMediaFsListing } from "@/app/lib/media/explorer";
import { notFound } from "next/navigation";

export default async function Page(props: {
  params: Promise<{ path: string[] }>;
}) {
  const { path: pathParts } = await props.params;
  const p = pathParts?.join("/") ?? "";
  const data = await getMediaFsListing(p);

  if (!data) notFound();

  return (
    <main>
      <Explorer data={data} />
    </main>
  );
}
