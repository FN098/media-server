import { Node } from "@/lib/node/types";

export type SortKey = "name" | "size" | "mtime";

export type SortDirection = "asc" | "desc";

export type SortOptions = {
  key?: SortKey;
  direction?: SortDirection;
  valueMapper?: (node: Node, key: SortKey) => unknown;
};

const collator = new Intl.Collator("ja-JP", {
  numeric: true, // 10 を 2 の後ろにする
  sensitivity: "base", // 大文字小文字・記号差を無視（Explorer寄り）
  ignorePunctuation: true, // 記号を無視
});

export function sortNodes(nodes: Node[], options?: SortOptions): Node[] {
  const { key = "name", direction = "asc", valueMapper } = options ?? {};

  // 昇順(asc) or 降順(desc)
  const modifier = direction === "asc" ? 1 : -1;

  const getValue = (node: Node, key: SortKey) =>
    valueMapper ? valueMapper(node, key) : node[key];

  return [...nodes].sort((a, b) => {
    // フォルダ優先
    if (a.type !== b.type) {
      return a.type === "folder" ? -1 : 1;
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
