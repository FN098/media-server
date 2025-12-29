import { MediaNode } from "@/lib/media/types";
import { getExtension, removeAllExtensions } from "@/lib/utils/filename";

export function formatNodes(nodes: MediaNode[]): MediaNode[] {
  // タイトルから拡張子を消し、拡張子をセット
  return nodes.map((e) => ({
    ...e,
    title: e.title ? removeAllExtensions(e.title) : undefined,
    extension: e.isDirectory
      ? undefined
      : getExtension(e.name, { withDot: false, case: "lower" }),
  }));
}
