import { encodePath } from "@/lib/path/encoder";
import { getClientExplorerPath, getClientTrashPath } from "@/lib/path/helpers";

export function resolveClientPath(
  virtualPath: string,
  options?: {
    isDeleted?: boolean;
  }
) {
  const encoded = encodePath(virtualPath);

  if (options?.isDeleted) return getClientTrashPath(encoded);

  return getClientExplorerPath(encoded);
}
