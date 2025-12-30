import { APP_CONFIG } from "@/app.config";
import { USER } from "@/basic-auth";
import { Favorites } from "@/components/ui/favorites";
import { formatNodes } from "@/lib/media/format";
import { getFavoriteMediaNodes } from "@/lib/media/repository";
import { ExplorerProvider } from "@/providers/explorer-provider";
import { Metadata } from "next";

// お気に入りページは動的ページとしてレンダリングする
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Favorites | ${APP_CONFIG.meta.title}`,
};

export default async function Page() {
  // TODO: ユーザー認証機能実装後に差し替える
  const nodes = await getFavoriteMediaNodes(USER);

  const formatted = formatNodes(nodes);

  return (
    <ExplorerProvider
      listing={{
        nodes: formatted,
        path: "",
        parent: null,
        prev: null,
        next: null,
      }}
    >
      <Favorites />
    </ExplorerProvider>
  );
}
