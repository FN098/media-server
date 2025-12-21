import { MediaFsListing, MediaFsNode } from "@/lib/media/types";

export function sortMediaFsNodes(nodes: MediaFsNode[]): MediaFsNode[] {
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

    // 名前を Windows Explorer 風に自然順ソート
    return collator.compare(a.name, b.name);
  });
}

export function withSortedNodes(listing: MediaFsListing): MediaFsListing {
  return {
    ...listing,
    nodes: sortMediaFsNodes(listing.nodes),
  };
}
