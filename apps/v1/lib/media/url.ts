import { encodePath } from "@/lib/path/encoder";
import { getAbsoluteApiMediaUrl, getApiMediaUrl } from "@/lib/path/helpers";
import { PATHS } from "@/lib/path/paths";
import path from "path";

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

export function resolveMediaUrl(media: Media, option?: UrlOption) {
  const basePath = media.isDeleted
    ? path.join(PATHS.virtual.trash.root, media.path)
    : media.path;

  const encoded = encodePath(basePath);

  const url = option?.absolute
    ? getAbsoluteApiMediaUrl(encoded)
    : getApiMediaUrl(encoded);

  return appendVersion(url, option?.version);
}
