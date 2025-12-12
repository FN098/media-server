import Explorer from "@/app/dashboard/explorer/ui/explorer";
import { ExplorerHeader } from "@/app/dashboard/explorer/ui/header";
import { SearchProvider } from "@/app/dashboard/explorer/ui/providers/use-search";
import { getMediaFsListing } from "@/app/lib/media/explorer";
import { notFound } from "next/navigation";

export default async function Page(props: {
  params: Promise<{ path?: string[] }>;
}) {
  const { path: pathParts = [] } = await props.params;
  const decodedPath = pathParts.map(decodeURIComponent).join("/");

  const data = await getMediaFsListing(decodedPath);
  if (!data) notFound();

  return (
    <SearchProvider>
      <ExplorerHeader />
      <Explorer data={data} />
    </SearchProvider>
  );
}
