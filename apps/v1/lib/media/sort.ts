import { SortOptions } from "@/lib/media/types";

const collator = new Intl.Collator("ja-JP", {
  numeric: true, // 10 を 2 の後ろにする
  sensitivity: "base", // 大文字小文字・記号差を無視（Explorer寄り）
  ignorePunctuation: true, // 記号を無視
});

export function sortNames(names: string[]): string[] {
  return [...names].sort((a, b) => collator.compare(a, b));
}

export function sortNodes<
  T extends {
    name: string;
    isDirectory: boolean;
  },
>(nodes: T[], options?: SortOptions<T>): T[] {
  const { key = "name", direction = "asc", valueMapper } = options ?? {};

  // 昇順(asc) or 降順(desc)
  const modifier = direction === "asc" ? 1 : -1;

  const getValue = (node: T, key: keyof T) =>
    valueMapper ? valueMapper(node, key) : node[key];

  return [...nodes].sort((a, b) => {
    // フォルダ優先
    if (a.isDirectory !== b.isDirectory) {
      return a.isDirectory ? -1 : 1;
    }

    const valA = getValue(a, key);
    const valB = getValue(b, key);

    // string 比較
    if (typeof valA === "string" && typeof valB === "string") {
      const result = collator.compare(valA, valB);
      return result !== 0
        ? result * modifier
        : collator.compare(a.name, b.name);
    }

    // undefined/null は最後
    if (valA == null && valB != null) return 1;
    if (valA != null && valB == null) return -1;
    if (valA == null && valB == null) {
      return collator.compare(a.name, b.name);
    }

    if (valA! < valB!) return -1 * modifier;
    if (valA! > valB!) return 1 * modifier;

    return collator.compare(a.name, b.name);
  });
}
