import { FileType } from "@/lib/file/file-types";
import { isMediaFile } from "@/lib/file/media-types";
import { NodeFilter } from "@/lib/node/types";

export type FileTypeFilterValue = {
  types: FileType[];
};

export function createFileTypeFilter(value: FileTypeFilterValue): NodeFilter {
  return (node) => {
    if (value.types.length === 0) return true;
    if (node.isDirectory) return false;
    return value.types.includes(node.type);
  };
}

export function createMediaOnlyFilter(): NodeFilter {
  return (node) => {
    if (node.isDirectory) return false;
    return isMediaFile(node.type);
  };
}
