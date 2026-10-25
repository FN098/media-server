import { PATHS } from "@/feature/paths";
import path from "path";

type Node = {
  id: string;
};

type Options = {
  version?: number;
};

export function getVideoUrl(node: Node, option: Options = {}) {
  const { version } = option;

  const baseUrl = path.join(
    window.location.origin,
    PATHS.api.media.file.root,
    node.id
  );

  const params = new URLSearchParams();

  if (version) {
    params.append("v", String(version));
  }

  return `${baseUrl}?${params.toString()}`;
}
