import { USER } from "@/basic-auth";
import { Favorites } from "@/components/ui/favorites";
import { getFavoriteMediaNodes } from "@/lib/media/listing";

// お気に入りページは動的ページとしてレンダリングする
export const dynamic = "force-dynamic";

export default async function Page() {
  // TODO: ユーザー認証機能実装後に差し替える
  const nodes = await getFavoriteMediaNodes(USER);

  return <Favorites nodes={nodes} />;
}
