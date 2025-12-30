export function uniqueBy<T>(
  array: T[],
  selector: keyof T | ((item: T) => unknown)
): T[] {
  const map = new Map<unknown, T>();

  for (const item of array) {
    // selector が関数の場合は実行し、文字列（キー）の場合はプロパティ値を取得
    const key =
      typeof selector === "function" ? selector(item) : item[selector];

    map.set(key, item);
  }

  return Array.from(map.values());
}
