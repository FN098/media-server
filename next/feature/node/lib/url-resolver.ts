import { getAbsoluteMediaApiUrl, getApiMediaUrl } from "@/__lib/path/helpers";

type Node = {
  id: string;
};

type Options = {
  absolute?: boolean;
  version?: number;
};

export function resolveMediaUrl(node: Node, option: Options = {}) {
  const { absolute, version } = option;

  const url = absolute
    ? getAbsoluteMediaApiUrl(node.id)
    : getApiMediaUrl(node.id);

  return version ? appendVersion(url, version) : url;
}

function appendVersion(url: string, version?: number) {
  if (!version) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${version}`;
}
