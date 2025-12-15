import { MediaFsNode, MediaFsNodeType } from "@/app/lib/media/types";

export const mediaTypes = ["audio", "image", "video"] as MediaFsNodeType[];

export const isMedia = (node: MediaFsNode) => mediaTypes.includes(node.type);
