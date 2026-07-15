import { isGroupMenuItem } from "@/lib/menu-items/guard";
import { MenuItemDef } from "@/lib/menu-items/types";

export type Transform<TItem, TContext> = (
  items: TItem[],
  context: TContext
) => TItem[];

export function createTransformer<
  TItem extends MenuItemDef<TContext>,
  TContext,
>(
  transforms: readonly Transform<TItem, TContext>[]
): Transform<TItem, TContext> {
  function apply(items: TItem[], context: TContext): TItem[] {
    return transforms.reduce(
      (current, transform) => transform(current, context),
      items
    );
  }

  return apply;
}

export function createRecursiveTransformer<
  TItem extends MenuItemDef<TContext>,
  TContext,
>(
  transforms: readonly Transform<TItem, TContext>[]
): Transform<TItem, TContext> {
  function apply(items: TItem[], context: TContext): TItem[] {
    const transformed = transforms.reduce(
      (current, transform) => transform(current, context),
      items
    );

    return transformed.map((item) => {
      if (!isGroupMenuItem(item)) return item;
      return { ...item, children: apply(item.children as TItem[], context) };
    });
  }
  return apply;
}
