// インデックス範囲外チェック
export const isOutOfBounds = <T>(index: number, arr: readonly T[]) =>
  index < 0 || index >= arr.length;

// 重複除去
export function unique<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}

// 重複除去（プロパティ名指定）
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

// 配列に変換
export function castArray<T>(value: T | T[]) {
  return Array.isArray(value) ? value : [value];
}

// チャンクに分割
export function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
