import { defaultFilters } from "@/__lib/menu-items/filters";
import { createRecursiveTransformer } from "@/__lib/menu-items/transformer";
import { MenuItemDef } from "@/__lib/menu-items/types";
import { useMobileContext } from "@/feature/mobile/providers/mobile-provider";
import { useMemo } from "react";

interface FavoritesActionMenuContext {
  isMobile: boolean; // ダミー（空のインターフェースはエラーになるため）
}

const actionMenuItems: MenuItemDef<FavoritesActionMenuContext>[] = [
  // メニューをここに追加
];

const transformer = createRecursiveTransformer<
  MenuItemDef<FavoritesActionMenuContext>,
  FavoritesActionMenuContext
>(defaultFilters);

export function useFavoritesActionMenu() {
  const isMobile = useMobileContext();

  const context = useMemo(() => {
    return {
      isMobile,
    } satisfies FavoritesActionMenuContext;
  }, [isMobile]);

  const transformed = useMemo(
    () => transformer(actionMenuItems, context),
    [context]
  );

  return {
    items: transformed,
    context,
  };
}
