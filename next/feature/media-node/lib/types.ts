import { FileNode } from "@/lib/node/types";

export type MediaNode = Omit<FileNode, "type"> & {
  type: "image" | "video" | "audio";
};
