import { MediaFsNode } from "@/lib/media/types";
import { shuffleArray, shuffleArrayWithSeed } from "@/lib/utils/shuffle";

export function shuffleNodes<T extends MediaFsNode>(
  nodes: T[],
  seed?: string
): T[] {
  if (seed && seed.trim() !== "") {
    return shuffleArrayWithSeed(nodes, seed);
  }
  return shuffleArray(nodes);
}
