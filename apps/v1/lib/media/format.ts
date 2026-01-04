import { allMediaExtensions } from "@/lib/media/extensions";
import { MediaNode } from "@/lib/media/types";
import { getExtension } from "@/lib/utils/filename";

const targetExtensions = [...allMediaExtensions] as string[];

export function formatNodes(nodes: MediaNode[]): MediaNode[] {
  return nodes.map((node) => {
    // ディレクトリの場合は処理をスキップ
    if (node.isDirectory) return node;

    // ファイル名から拡張子を取得
    const ext = getExtension(node.name, { withDot: true, case: "lower" });
    if (!ext || !targetExtensions.includes(ext)) return node;

    // タイトルの加工
    const newTitle = node.title ? node.title.replace(ext, "") : node.title;

    return {
      ...node,
      title: newTitle,
    };
  });
}
