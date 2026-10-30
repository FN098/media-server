import { APP_CONFIG } from "@/app.config";
import { PATHS } from "@/feature/paths";
import path from "path";

export function resolveMediaPath(virtualPath: string): string {
  return path.join(PATHS.server.media.root, virtualPath);
}

export function resolveMediaThumbnailPath(
  virtualPath: string,
  isDirectory: boolean
): string {
  return isDirectory
    ? path.join(PATHS.server.media.thumb.root, virtualPath)
    : path.join(PATHS.server.media.thumb.root, virtualPath) +
        APP_CONFIG.thumb.extension;
}
