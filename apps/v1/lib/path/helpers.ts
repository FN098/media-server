import { APP_CONFIG } from "@/app.config";
import { PATHS } from "@/lib/path/paths";
import { getAbsoluteUrl } from "@/lib/utils/url";
import path from "path";

export function getAbsoluteApiMediaUrl(mediaPath: string) {
  return getAbsoluteUrl(getApiMediaUrl(mediaPath));
}

export function getApiMediaUrl(mediaPath: string) {
  return path.join(PATHS.api.media.file.root, mediaPath);
}

export function getApiThumbUrl(mediaPath: string) {
  return path.join(
    PATHS.api.media.file.thumb.root,
    mediaPath + APP_CONFIG.thumb.extension
  );
}

export function getApiThumbEventsUrl() {
  return PATHS.api.thumb.events.root;
}

export function getServerMediaPath(mediaPath: string): string {
  return path.join(PATHS.server.media.root, mediaPath);
}

export function getServerMediaThumbPath(
  mediaPath: string,
  isDirectory?: boolean
): string {
  return path.join(
    PATHS.server.media.thumb.root,
    mediaPath + (isDirectory ? "" : APP_CONFIG.thumb.extension)
  );
}

export function getServerMediaTrashPath(mediaPath: string): string {
  return path.join(PATHS.server.media.trash.root, mediaPath);
}

export function getServerMediaDbPath(mediaPath: string): string {
  return path.join(PATHS.server.media.db.root, mediaPath);
}

export function getClientExplorerPath(mediaPath: string): string {
  return path.join(PATHS.client.explorer.root, mediaPath);
}

export function getClientTrashPath(mediaPath: string): string {
  return path.join(PATHS.client.trash.root, mediaPath);
}

export function getParentDirPath(filePath: string): string {
  const dir = path.dirname(filePath);

  // path.dirname はルート付近で "." を返すことがあるため、
  // アプリケーションの仕様に合わせて調整（空文字にする等）
  return dir === "." ? "" : dir.replace(/\\/g, "/");
}

/**
 * サムネイルの絶対パスから、DB上の mediaPath を復元する
 */
export function getMediaPathFromThumbPath(fullThumbPath: string): string {
  // 1. ルートディレクトリ部分を削除
  let virtualPath = fullThumbPath.replace(PATHS.server.media.thumb.root, "");

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
