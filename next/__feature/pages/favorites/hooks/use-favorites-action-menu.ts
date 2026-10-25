import { useDetectMobileContext } from "@/__feature/mobile/providers/mobile-provider";
import { defaultFilters } from "@/__lib/menu-items/filters";
import { createRecursiveTransformer } from "@/__lib/menu-items/transformer";
import { MenuItemDef } from "@/__lib/menu-items/types";
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
  const isMobile = useDetectMobileContext();

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
