/** @deprecated */
export function getAbsoluteMediaApiUrl(): string {
  return "";
  // const baseUrl = getWebApiUrl();
  // const path = getApiMediaUrl(virtualPath);
  // return getAbsoluteFileUrl(baseUrl, path);
}

/** @deprecated */
export function getApiMediaUrl(virtualPath: string) {
  return "";
  // return joinUrlPath(PATHS.api.media.file.root, virtualPath);
}

/** @deprecated */
export function getAbsoluteApiThumbUrl(virtualPath: string): string {
  return "";
  // const baseUrl = getWebApiUrl();
  // const path = getApiThumbPath(virtualPath);
  // return getAbsoluteFileUrl(baseUrl, path);
}

/** @deprecated */
export function getApiThumbPath(virtualPath: string) {
  return "";
  // return joinUrlPath(
  //   PATHS.api.media.file.thumb.root,
  //   virtualPath + APP_CONFIG.thumb.extension
  // );
}

/** @deprecated */
export function getApiThumbEventsPath() {
  return "";
  // return PATHS.api.thumb.events.root;
}

/** @deprecated */
export function getServerMediaPath(virtualPath: string): string {
  return "";
  // return joinUrlPath(PATHS.server.media.root, virtualPath);
}

/** @deprecated */
export function getServerMediaThumbPath(
  virtualPath: string,
  isDirectory?: boolean
): string {
  return "";
  // return joinUrlPath(
  //   PATHS.server.media.thumb.root,
  //   virtualPath + (isDirectory ? "" : APP_CONFIG.thumb.extension)
  // );
}

/** @deprecated */
export function getServerMediaTrashPath(virtualPath: string): string {
  return "";
  // return joinUrlPath(PATHS.server.media.trash.root, virtualPath);
}

/** @deprecated */
export function getServerMediaDbPath(virtualPath: string): string {
  return "";
  // return joinUrlPath(PATHS.server.media.db.root, virtualPath);
}

/** @deprecated */
export function getClientExplorerPath(virtualPath: string): string {
  return "";
  // return joinUrlPath(PATHS.client.explorer.root, virtualPath);
}

/** @deprecated */
export function getClientTrashPath(virtualPath: string): string {
  return "";
  // return joinUrlPath(PATHS.client.trash.root, virtualPath);
}

/** @deprecated */
export function getMediaPathFromThumbPath(realThumbPath: string): string {
  return "";

  // // 1. ルートディレクトリ部分を削除
  // let virtualPath = realThumbPath.replace(PATHS.server.media.thumb.root, "");

  // // 2. 先頭のスラッシュを調整
  // if (virtualPath.startsWith(path.sep)) {
  //   virtualPath = virtualPath.substring(1);
  // }

  // // 3. サムネイル用拡張子を削除
  // const ext = APP_CONFIG.thumb.extension;
  // if (virtualPath.endsWith(ext)) {
  //   virtualPath = virtualPath.slice(0, -ext.length);
  // }

  // return virtualPath;
}
