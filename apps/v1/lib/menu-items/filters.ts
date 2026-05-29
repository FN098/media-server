type HiddenProp<TContext> = boolean | ((context: TContext) => boolean);

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

export const defaultFilters = [filterHiddenItems, filterSeparators] as const;
