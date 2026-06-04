import { defaultFilters } from "@/lib/menu-items/filters";
import { createRecursiveTransformer } from "@/lib/menu-items/transformer";
import { MenuItemDef } from "@/lib/menu-items/types";
import { useIsMobile } from "@/shadcn/hooks/use-mobile";
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
  const isMobile = useIsMobile();

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
