import { USER } from "@/basic-auth";
import { Explorer } from "@/components/ui/explorer";
import { getFavoriteMediaNodes } from "@/lib/media/listing";
import { sortMediaNodes } from "@/lib/media/sort";

export default async function Page() {
  // TODO: ユーザー認証機能実装後に差し替える
  const nodes = await getFavoriteMediaNodes(USER);

  const sorted = sortMediaNodes(nodes, { key: "path" });

  return <Explorer nodes={sorted} />;
}
