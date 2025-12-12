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

  // 一つ上の階層のフォルダを先頭に追加
  if (data?.parent !== null) {
    data.nodes.unshift({
      name: "..",
      path: data.parent,
      isDirectory: true,
      type: "directory",
      updatedAt: "",
    });
  }

  return (
    <SearchProvider>
      <ExplorerHeader />
      <Explorer data={data} />
    </SearchProvider>
  );
}
