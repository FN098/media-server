import { encodePath } from "@/lib/path/encoder";
import { getAbsoluteApiThumbUrl, getApiThumbPath } from "@/lib/path/helpers";

type Media = {
  path: string;
  isDeleted?: boolean;
};

type UrlOptions = {
  absolute?: boolean;
  version?: number;
};

export function resolveMediaThumbUrl(media: Media, options?: UrlOptions) {
  // ファイルを削除してもサムネイルはそのまま残るので同じパスを参照
  const basePath = media.path;
  const encoded = encodePath(basePath);

  const url = options?.absolute
    ? getAbsoluteApiThumbUrl(encoded)
    : getApiThumbPath(encoded);

  return options?.version ? appendVersion(url, options.version) : url;
}

function appendVersion(url: string, version: number) {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${version}`;
}
