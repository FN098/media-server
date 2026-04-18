import { encodePath } from "@/lib/path/encoder";
import {
  getAbsoluteApiMediaUrl,
  getApiMediaUrl,
  getApiThumbUrl,
} from "@/lib/path/helpers";
import { PATHS } from "@/lib/path/paths";
import path from "path";

type Media = {
  path: string;
  isDeleted?: boolean;
};

type ResolveOption = {
  absolute?: boolean;
};

export function resolveMediaUrl(media: Media, option?: ResolveOption) {
  const basePath = media.isDeleted
    ? path.join(PATHS.virtual.trash.root, media.path)
    : media.path;

  const encoded = encodePath(basePath);

  if (option?.absolute) {
    return getAbsoluteApiMediaUrl(encoded);
  }

  return getApiMediaUrl(encoded);
}

export function resolveMediaThumbUrl(media: Media, option?: ResolveOption) {
  // ファイルを削除してもサムネイルはそのまま残るので同じパスを参照
  const basePath = media.isDeleted ? media.path : media.path;
  const encoded = encodePath(basePath);

  if (option?.absolute) {
    return getAbsoluteApiMediaUrl(encoded);
  }

  return getApiThumbUrl(encoded);
}
