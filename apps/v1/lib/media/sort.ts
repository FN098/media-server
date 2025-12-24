import { MediaFsNode, MediaNode } from "@/lib/media/types";

type SortableNode = {
  isDirectory: boolean;
  name: string;
};

type SortOptions<T> = {
  key: keyof T;
};

function sorted<T extends SortableNode>(
  nodes: T[],
  options: SortOptions<T> = { key: "name" }
): T[] {
  const collator = new Intl.Collator("ja-JP", {
    numeric: true, // 10 を 2 の後ろにする
    sensitivity: "base", // 大文字小文字・記号差を無視（Explorer寄り）
    ignorePunctuation: true, // 記号を無視
  });

  return [...nodes].sort((a, b) => {
    // フォルダ → ファイル
    if (a.isDirectory !== b.isDirectory) {
      return a.isDirectory ? -1 : 1;
    }

    const key = options.key;
    const valueA = a[key];
    const valueB = b[key];

    // 名前を Windows Explorer 風に自然順ソート
    return collator.compare(String(valueA), String(valueB));
  });
}

export function sortMediaFsNodes(
  nodes: MediaFsNode[],
  options?: SortOptions<MediaFsNode>
): MediaFsNode[] {
  return sorted(nodes, options);
}

export function sortMediaNodes(
  nodes: MediaNode[],
  options?: SortOptions<MediaNode>
): MediaNode[] {
  return sorted(nodes, options);
}
