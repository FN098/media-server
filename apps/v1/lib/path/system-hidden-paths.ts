import { getClientExplorerPath, getServerMediaPath } from "@/lib/path/helpers";

// この Media Server アプリ内で使用する隠しフォルダ（ユーザーが直接アクセスできないように）
const SYSTEM_HIDDEN_PATHS = [".thumb", ".db", ".trash"] as const;

const makeHidden = (mapper: (p: string) => string) =>
  SYSTEM_HIDDEN_PATHS.map(mapper);

const hiddenPaths = {
  virtual: [...SYSTEM_HIDDEN_PATHS],
  server: makeHidden(getServerMediaPath),
  client: makeHidden(getClientExplorerPath),
};

const isHidden = (pathname: string, hiddenPaths: string[]) =>
  hiddenPaths.some((p) => pathname === p || pathname.startsWith(p + "/"));

export const isHiddenVirtualPath = (pathname: string) => {
  return isHidden(pathname, hiddenPaths.virtual);
};

export const isHiddenServerPath = (pathname: string) => {
  return isHidden(pathname, hiddenPaths.server);
};

export const isHiddenClientPath = (pathname: string) => {
  return isHidden(pathname, hiddenPaths.client);
};
