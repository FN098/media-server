import { APP_CONFIG } from "@/app.config";
import { USER } from "@/basic-auth";
import { Favorites } from "@/components/ui/favorites";
import { FavoritesRecord } from "@/lib/favorite/types";
import { formatNodes } from "@/lib/media/format";
import { ExplorerProvider } from "@/providers/explorer-provider";
import { FavoritesProvider } from "@/providers/favorites-provider";
import { SelectionProvider } from "@/providers/selection-provider";
import { getFavoriteMediaNodes } from "@/repositories/media-repository";
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

  const favorites: FavoritesRecord = Object.fromEntries(
    formatted.map((n) => [n.path, n.isFavorite])
  );

  const listing = {
    nodes: formatted,
    path: "",
    parent: null,
    prev: null,
    next: null,
  };

  return (
    <SelectionProvider>
      <FavoritesProvider favorites={favorites}>
        <ExplorerProvider listing={listing}>
          <Favorites />
        </ExplorerProvider>
      </FavoritesProvider>
    </SelectionProvider>
  );
}
