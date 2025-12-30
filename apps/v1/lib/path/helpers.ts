import { APP_CONFIG } from "@/app.config";
import { PATHS } from "@/lib/path/paths";
import { getAbsoluteUrl } from "@/lib/utils/url";
import path from "path";

export function getAbsoluteMediaUrl(mediaPath: string) {
  return getAbsoluteUrl(getMediaUrl(mediaPath));
}

export function getMediaUrl(mediaPath: string) {
  return path.join(PATHS.api.media.file.root, mediaPath);
}

export function getThumbUrl(mediaPath: string) {
  return path.join(
    PATHS.api.media.file.thumb.root,
    mediaPath + APP_CONFIG.thumb.extension
  );
}

export function getMediaPath(mediaPath: string): string {
  return path.join(PATHS.server.media.root, mediaPath);
}

export function getMediaThumbPath(mediaPath: string): string {
  return path.join(
    PATHS.server.media.thumb.root,
    mediaPath + APP_CONFIG.thumb.extension
  );
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

export function getThumbEventsUrl() {
  return PATHS.api.thumb.events.root;
}
