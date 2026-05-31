import { getBlockedExplorerPaths } from "@/lib/env/env-server";
import { getClientExplorerPath, getServerMediaPath } from "@/lib/path/helpers";

const blockedPaths = getBlockedExplorerPaths();

const blackListPathsVirtual = [...blockedPaths];
const blackListPathsServer = blockedPaths.map((p) => getServerMediaPath(p));
const blackListPathsClient = blockedPaths.map((p) => getClientExplorerPath(p));

const isBlocked = (pathname: string, blacklist: string[]) => {
  return blacklist.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );
};

export const isBlockedVirtualPath = (pathname: string) => {
  return isBlocked(pathname, blackListPathsVirtual);
};

export const isBlockedServerPath = (pathname: string) => {
  return isBlocked(pathname, blackListPathsServer);
};

export const isBlockedClientPath = (pathname: string) => {
  return isBlocked(pathname, blackListPathsClient);
};
