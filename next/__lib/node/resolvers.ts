import { encodePath } from "@/__lib/path/encoder";
import { getAbsoluteApiMediaUrl, getApiMediaPath } from "@/__lib/path/helpers";
import { PATHS } from "@/__lib/path/paths";
import { joinUrlPath } from "@/__lib/utils/url";

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
    ? joinUrlPath(PATHS.virtual.trash.root, media.path)
    : media.path;

  const encoded = encodePath(basePath);

  const url = option?.absolute
    ? getAbsoluteApiMediaUrl(encoded)
    : getApiMediaPath(encoded);

  return appendVersion(url, option?.version);
}
