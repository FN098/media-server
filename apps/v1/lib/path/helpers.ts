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

export function getServerMediaThumbPath(mediaPath: string): string {
  return path.join(
    PATHS.server.media.thumb.root,
    mediaPath + APP_CONFIG.thumb.extension
  );
}

export function getServerMediaTrashPath(mediaPath: string): string {
  return path.join(PATHS.server.media.trash.root, mediaPath);
}

export function getClientExplorerPath(mediaPath: string): string {
  return path.join(PATHS.client.explorer.root, mediaPath);
}

export function getParentDirPath(filePath: string): string {
  const dir = path.dirname(filePath);

  // path.dirname はルート付近で "." を返すことがあるため、
  // アプリケーションの仕様に合わせて調整（空文字にする等）
  return dir === "." ? "" : dir.replace(/\\/g, "/");
}
