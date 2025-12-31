import { allMediaExtensions } from "@/lib/media/extensions";
import { MediaNode } from "@/lib/media/types";
import { getExtension } from "@/lib/utils/filename";

export function formatNodes(nodes: MediaNode[]): MediaNode[] {
  const targetExtensions = [...allMediaExtensions] as string[];

  const extensionRegex = new RegExp(`\\.(${targetExtensions.join("|")})$`, "i");

  return nodes.map((node) => {
    // ディレクトリの場合は処理をスキップ
    if (node.isDirectory) {
      return node;
    }

    // ファイル名から拡張子を取得
    const ext = getExtension(node.name, { withDot: false, case: "lower" });

    // タイトルの加工
    let newTitle = node.title;
    if (node.title && targetExtensions.includes(ext || "")) {
      newTitle = node.title.replace(extensionRegex, "");
    }

    return {
      ...node,
      title: newTitle,
      extension: ext,
    };
  });
}
