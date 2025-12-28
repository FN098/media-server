import { MediaFsNode } from "@/lib/media/types";

export type SortOrder = "asc" | "desc";

export type SortOptions<T> = {
  key: keyof T;
  order?: SortOrder;
};

const collator = new Intl.Collator("ja-JP", {
  numeric: true, // 10 を 2 の後ろにする
  sensitivity: "base", // 大文字小文字・記号差を無視（Explorer寄り）
  ignorePunctuation: true, // 記号を無視
});

export function sortNames(names: string[]): string[] {
  return [...names].sort((a, b) => collator.compare(a, b));
}

export function sortMediaFsNodes(
  nodes: MediaFsNode[],
  options: SortOptions<MediaFsNode> = { key: "name", order: "asc" }
): MediaFsNode[] {
  const { key = "name", order = "asc" } = options;
  const modifier = order === "asc" ? 1 : -1;

  return [...nodes].sort((a, b) => {
    // 1. フォルダ優先
    if (a.isDirectory !== b.isDirectory) {
      return a.isDirectory ? -1 : 1;
    }

    // 2. 指定されたキーで比較
    if (key === "name" || key === "path") {
      return collator.compare(a[key], b[key]) * modifier;
    }

    const valA = a[key] ?? 0;
    const valB = b[key] ?? 0;

    if (valA < valB) return -1 * modifier;
    if (valA > valB) return 1 * modifier;

    return 0;
  });
}
