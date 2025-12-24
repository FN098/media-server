import { USER } from "@/basic-auth";
import { Favorites } from "@/components/ui/favorites";
import { getFavoriteMediaNodes } from "@/lib/media/listing";

export default async function Page() {
  // TODO: ユーザー認証機能実装後に差し替える
  const nodes = await getFavoriteMediaNodes(USER);

  return <Favorites nodes={nodes} />;
}
