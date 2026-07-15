import { MediaNode } from "@/lib/media/types";
import { getFilenameWithoutExt } from "@/lib/utils/filename";

export function formatNodes(nodes: MediaNode[]): MediaNode[] {
  return nodes.map((node) => {
    // ディレクトリの場合は処理をスキップ
    if (node.isDirectory) return node;

    // タイトルの加工
    const title = node.title ?? getFilenameWithoutExt(node.path);

    return {
      ...node,
      title,
    };
  });
}
