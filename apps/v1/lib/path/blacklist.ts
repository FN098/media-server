import { getClientExplorerPath, getServerMediaPath } from "@/lib/path/helpers";

export const blackListInExplorer = [".thumb", ".trash"];

export const blackListVirtualPaths = [...blackListInExplorer];

export const blackListServerPaths = [
  ...blackListInExplorer.map((p) => getServerMediaPath(p)),
];

export const blackListClientPaths = [
  ...blackListInExplorer.map((p) => getClientExplorerPath(p)),
];

const isBlockedPath = (pathname: string, blacklist: string[]) => {
  return blacklist.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );
};

export const isBlockedVirtualPath = (pathname: string) =>
  isBlockedPath(pathname, blackListVirtualPaths);

export const isBlockedServerPath = (pathname: string) =>
  isBlockedPath(pathname, blackListServerPaths);

export const isBlockedClientPath = (pathname: string) =>
  isBlockedPath(pathname, blackListClientPaths);
