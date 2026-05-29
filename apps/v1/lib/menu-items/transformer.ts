type Transform<TItem, TContext> = (
  items: TItem[],
  context: TContext
) => TItem[];

type RecursiveMenuItem<TItem> = {
  type: string;
  children?: TItem[];
};

type TransformerOptions = {
  recurse?: boolean;
};

export function createTransformer<
  TItem extends RecursiveMenuItem<TItem>,
  TContext,
>(
  transforms: readonly Transform<TItem, TContext>[],
  defaultOptions?: TransformerOptions
) {
  function run(
    items: TItem[],
    context: TContext,
    options?: TransformerOptions
  ): TItem[] {
    const resolvedOptions = {
      ...defaultOptions,
      ...options,
    };

    const transformed = transforms.reduce(
      (current, transform) => transform(current, context),
      items
    );

    if (!resolvedOptions.recurse) {
      return transformed;
    }

    return transformed.map((item) => {
      if (!item.children) return item;

      return {
        ...item,
        children: run(item.children, context, resolvedOptions),
      };
    });
  }

  return run;
}
