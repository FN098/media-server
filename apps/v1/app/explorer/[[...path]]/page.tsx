import Explorer from "@/app/explorer/ui/explorer";
import { ViewModeProvider } from "@/app/explorer/ui/providers/view-mode-provider";
import { getMediaFsListing } from "@/app/lib/media/explorer";
import { notFound } from "next/navigation";

export default async function Page(props: {
  params: Promise<{ path: string[] }>;
}) {
  const { path: pathParts } = await props.params;
  const decodedPath = pathParts.map(decodeURIComponent).join("/");

  const data = await getMediaFsListing(decodedPath);
  if (!data) notFound();

  return (
    <main>
      <ViewModeProvider>
        <Explorer data={data} />
      </ViewModeProvider>
    </main>
  );
}
