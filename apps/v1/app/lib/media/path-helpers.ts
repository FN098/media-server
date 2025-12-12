import { APP_CONFIG } from "@/app.config";
import { PATHS } from "@/app/lib/media/paths";
import path from "path";

export function getThumbUrl(nodePath: string) {
  return path.join(PATHS.api.thumbRoot, nodePath + APP_CONFIG.thumb.extension);
}

export function getMediaPath(nodePath: string): string {
  return path.join(PATHS.server.mediaRoot, nodePath);
}

export function getMediaThumbPath(nodePath: string): string {
  return path.join(
    PATHS.server.thumbRoot,
    nodePath + APP_CONFIG.thumb.extension
  );
}

export function getClientExplorerPath(nodePath: string): string {
  return path.join(PATHS.client.explorer, nodePath);
}
