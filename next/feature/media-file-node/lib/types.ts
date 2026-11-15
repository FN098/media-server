import { FileNode } from "@/lib/node/types";

export type MediaFileNode = Omit<FileNode, "type"> & {
  type: "image" | "video" | "audio";
};
