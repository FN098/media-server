import { PATHS } from "@/feature/paths";
import path from "path";

export function resolveRealPath(virtualPath: string): string {
  return path.join(PATHS.server.media.root, virtualPath);
}
