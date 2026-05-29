import { encodePath } from "@/lib/path/encoder";
import { getAbsoluteApiMediaUrl, getApiThumbUrl } from "@/lib/path/helpers";

type Media = {
  path: string;
  isDeleted?: boolean;
};

type UrlOption = {
  absolute?: boolean;
  version?: number;
};

function appendVersion(url: string, version?: number) {
  if (!version) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${version}`;
}

export function resolveMediaThumbUrl(media: Media, option?: UrlOption) {
  // ファイルを削除してもサムネイルはそのまま残るので同じパスを参照
  const basePath = media.path;
  const encoded = encodePath(basePath);

  const url = option?.absolute
    ? getAbsoluteApiMediaUrl(encoded)
    : getApiThumbUrl(encoded);

  return appendVersion(url, option?.version);
}
