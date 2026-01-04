export function unique<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}

export function uniqueBy<T>(
  array: T[],
  selector?: keyof T | ((item: T) => unknown)
): T[] {
  const map = new Map<unknown, T>();

  for (const item of array) {
    const key =
      selector === undefined
        ? item
        : typeof selector === "function"
          ? selector(item)
          : item[selector];

    map.set(key, item);
  }

  return Array.from(map.values());
}
