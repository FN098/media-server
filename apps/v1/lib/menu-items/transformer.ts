export type Transform<TItem, TContext> = (
  items: TItem[],
  context: TContext
) => TItem[];

export function createTransformer<TItem, TContext>(
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
  TItem extends { key: string; children?: TItem[] },
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
      if (!item.children) return item;
      return { ...item, children: apply(item.children, context) };
    });
  }
  return apply;
}
