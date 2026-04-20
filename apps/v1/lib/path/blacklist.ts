import { getClientExplorerPath, getServerMediaPath } from "@/lib/path/helpers";

const blackListPaths = [".thumb", ".trash", ".db"] as const;

const blackListPathsVirtual = [...blackListPaths];
const blackListPathsServer = blackListPaths.map((p) => getServerMediaPath(p));
const blackListPathsClient = blackListPaths.map((p) =>
  getClientExplorerPath(p)
);

const isBlockedPath = (pathname: string, blacklist: string[]) => {
  return blacklist.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );
};

export const isBlockedVirtualPath = (pathname: string) => {
  return isBlockedPath(pathname, blackListPathsVirtual);
};

export const isBlockedServerPath = (pathname: string) => {
  return isBlockedPath(pathname, blackListPathsServer);
};

export const isBlockedClientPath = (pathname: string) => {
  return isBlockedPath(pathname, blackListPathsClient);
};
