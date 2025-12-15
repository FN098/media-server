import { APP_CONFIG } from "@/app.config";
import { PATHS } from "@/app/lib/paths";
import path from "path";

export function getMediaUrl(nodePath: string) {
  return path.join(PATHS.api.media.root, nodePath);
}

export function getThumbUrl(nodePath: string) {
  return path.join(
    PATHS.api.media.thumb.root,
    nodePath + APP_CONFIG.thumb.extension
  );
}

export function getMediaPath(nodePath: string): string {
  return path.join(PATHS.server.media.root, nodePath);
}

export function getMediaThumbPath(nodePath: string): string {
  return path.join(
    PATHS.server.media.thumb.root,
    nodePath + APP_CONFIG.thumb.extension
  );
}

export function getClientExplorerPath(nodePath: string): string {
  return path.join(PATHS.client.explorer.root, nodePath);
}
