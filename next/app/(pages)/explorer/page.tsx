import { createRootFolder, getRootFolderId } from "@/lib/folder/repository";
import { redirect } from "next/navigation";

export default async function ExplorerRootPage() {
  let rootId = await getRootFolderId();

  if (!rootId) {
    const root = await createRootFolder();
    rootId = root.id;
  }

  redirect(`/explorer/${rootId}`);
}
