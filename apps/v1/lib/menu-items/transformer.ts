type HiddenProp<TContext> = boolean | ((context: TContext) => boolean);

type MenuItemTransform<TItem, TContext> = (
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

export function filterHiddenItems<
  TItem extends { hidden?: HiddenProp<TContext> },
  TContext,
>(items: TItem[], context: TContext): TItem[] {
  return items.filter((item) => {
    if (typeof item.hidden === "function") {
      return !item.hidden(context);
    }
    return !item.hidden;
  });
}

export function filterSeparators<TItem extends { type: string }, TContext>(
  items: TItem[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _context: TContext
): TItem[] {
  return items.filter((item, index, array) => {
    if (item.type !== "separator") return true;

    const prev = array[index - 1];
    const next = array[index + 1];

    if (!prev || !next) return false;
    if (prev.type === "separator") return false;

    return true;
  });
}

export function createTransformer<
  TItem extends RecursiveMenuItem<TItem>,
  TContext,
>(
  transforms: MenuItemTransform<TItem, TContext>[],
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
