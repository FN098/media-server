import { PATHS } from "@/feature/paths";
import path from "path";

type Options = {
  version?: number;
};

export function getImageUrl(fileId: string, option: Options = {}) {
  const { version } = option;

  const baseUrl = path.join(
    window.location.origin,
    PATHS.api.media.file.root,
    fileId
  );

  const params = new URLSearchParams();

  if (version) {
    params.append("v", String(version));
  }

  return `${baseUrl}?${params.toString()}`;
}
