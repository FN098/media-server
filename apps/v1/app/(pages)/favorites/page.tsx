import { APP_CONFIG } from "@/app.config";
import { USER } from "@/basic-auth";
import { Explorer } from "@/components/ui/explorer";
import { formatNodes } from "@/lib/media/format";
import { ExplorerProvider } from "@/providers/explorer-provider";
import { PathSelectionProvider } from "@/providers/path-selection-provider";
import { getFavoriteMediaNodes } from "@/repositories/media-repository";
import { Metadata } from "next";

// お気に入りページは動的ページとしてレンダリングする
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Favorites | ${APP_CONFIG.meta.title}`,
};

export default async function Page() {
  // TODO: ユーザー認証機能実装後に差し替える
  const allNodes = await getFavoriteMediaNodes(USER);

  const formatted = formatNodes(allNodes);

  const listing = {
    nodes: formatted,
    path: "",
    parent: null,
    prev: null,
    next: null,
  };

  return (
    <ExplorerProvider listing={listing}>
      <PathSelectionProvider>
        <Explorer mode="favorite" />
      </PathSelectionProvider>
    </ExplorerProvider>
  );
}
