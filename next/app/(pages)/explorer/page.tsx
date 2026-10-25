import { createRootFolder, getRootFolder } from "@/lib/folder/repository";
import { redirect } from "next/navigation";

export default async function ExplorerRootPage() {
  let root = await getRootFolder();

  if (!root) {
    root = await createRootFolder();
  }

  redirect(`/explorer/${root.id}`);
}
