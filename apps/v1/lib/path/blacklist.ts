import { getClientExplorerPath, getServerMediaPath } from "@/lib/path/helpers";

export const blackListInExplorer = [".thumb", ".trash"];

const isBlockedPath = (pathname: string, blacklist: string[]) => {
  return blacklist.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );
};

export const isBlockedVirtualPath = (pathname: string) => {
  const blacklist = [...blackListInExplorer];
  return isBlockedPath(pathname, blacklist);
};

export const isBlockedServerPath = (pathname: string) => {
  const blacklist = [...blackListInExplorer.map((p) => getServerMediaPath(p))];
  return isBlockedPath(pathname, blacklist);
};

export const isBlockedClientPath = (pathname: string) => {
  const blacklist = [
    ...blackListInExplorer.map((p) => getClientExplorerPath(p)),
  ];
  return isBlockedPath(pathname, blacklist);
};
