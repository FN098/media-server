import { APP_CONFIG } from "@/app.config";
import { getWebApiUrl } from "@/lib/env/helpers";
import { PATHS } from "@/lib/path/paths";
import { getAbsoluteUrl, joinUrlPath } from "@/lib/utils/url";
import path from "path";

export function getAbsoluteApiMediaUrl(virtualPath: string): string {
  const baseUrl = getWebApiUrl();
  const path = getApiMediaPath(virtualPath);
  return getAbsoluteUrl(baseUrl, path);
}

export function getApiMediaPath(virtualPath: string) {
  return joinUrlPath(PATHS.api.media.file.root, virtualPath);
}

export function getAbsoluteApiThumbUrl(virtualPath: string): string {
  const baseUrl = getWebApiUrl();
  const path = getApiThumbPath(virtualPath);
  return getAbsoluteUrl(baseUrl, path);
}

export function getApiThumbPath(virtualPath: string) {
  return joinUrlPath(
    PATHS.api.media.file.thumb.root,
    virtualPath + APP_CONFIG.thumb.extension
  );
}

export function getApiThumbEventsPath() {
  return PATHS.api.thumb.events.root;
}

export function getServerMediaPath(virtualPath: string): string {
  return joinUrlPath(PATHS.server.media.root, virtualPath);
}

export function getServerMediaThumbPath(
  virtualPath: string,
  isDirectory?: boolean
): string {
  return joinUrlPath(
    PATHS.server.media.thumb.root,
    virtualPath + (isDirectory ? "" : APP_CONFIG.thumb.extension)
  );
}

export function getServerMediaTrashPath(virtualPath: string): string {
  return joinUrlPath(PATHS.server.media.trash.root, virtualPath);
}

export function getServerMediaDbPath(virtualPath: string): string {
  return joinUrlPath(PATHS.server.media.db.root, virtualPath);
}

export function getClientExplorerPath(virtualPath: string): string {
  return joinUrlPath(PATHS.client.explorer.root, virtualPath);
}

export function getClientTrashPath(virtualPath: string): string {
  return joinUrlPath(PATHS.client.trash.root, virtualPath);
}

export function getParentDirPath(virtualPath: string): string {
  const dir = path.dirname(virtualPath);

  // path.dirname はルート付近で "." を返すことがあるため、
  // アプリケーションの仕様に合わせて調整（空文字にする等）
  return dir === "." ? "" : dir.replace(/\\/g, "/");
}

/**
 * サムネイルの絶対パスから、DB上の mediaPath を復元する
 */
export function getMediaPathFromThumbPath(realThumbPath: string): string {
  // 1. ルートディレクトリ部分を削除
  let virtualPath = realThumbPath.replace(PATHS.server.media.thumb.root, "");

  // 2. 先頭のスラッシュを調整
  if (virtualPath.startsWith(path.sep)) {
    virtualPath = virtualPath.substring(1);
  }

  // 3. サムネイル用拡張子を削除
  const ext = APP_CONFIG.thumb.extension;
  if (virtualPath.endsWith(ext)) {
    virtualPath = virtualPath.slice(0, -ext.length);
  }

  return virtualPath;
}
