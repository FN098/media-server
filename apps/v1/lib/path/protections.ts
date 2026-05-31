import { getClientExplorerPath, getServerMediaPath } from "@/lib/path/helpers";

// この Media Server アプリ内で使用する隠しフォルダ（ユーザーが直接アクセスできないように）
const SYSTEM_HIDDEN_PATHS = [".thumb", ".db", ".trash"] as const;

const makeHidden = (mapper: (p: string) => string) =>
  SYSTEM_HIDDEN_PATHS.map(mapper);

const hiddenPaths = {
  virtual: [...SYSTEM_HIDDEN_PATHS],
  real: makeHidden(getServerMediaPath),
  clientExplorer: makeHidden(getClientExplorerPath),
};

const isHidden = (pathname: string, hiddenPaths: string[]) =>
  hiddenPaths.some((p) => pathname === p || pathname.startsWith(p + "/"));

// 仮想パス

export const isSystemHiddenVirtualPath = (pathname: string) => {
  return isHidden(pathname, hiddenPaths.virtual);
};

export const isBlockedVirtualPath = (pathname: string) => {
  return isSystemHiddenVirtualPath(pathname);
};

// 物理パス

export const isSystemHiddenRealPath = (pathname: string) => {
  return isHidden(pathname, hiddenPaths.real);
};

// クライアントパス

export const isSystemHiddenClientPath = (pathname: string) => {
  return isHidden(pathname, hiddenPaths.clientExplorer);
};

export const isBlockedClientPath = (pathname: string) => {
  return isSystemHiddenClientPath(pathname);
};
