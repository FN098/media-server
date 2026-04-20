import { encodePath } from "@/lib/path/encoder";
import { getClientExplorerPath, getClientTrashPath } from "@/lib/path/helpers";

type Options = {
  isDeleted?: boolean;
};

export function resolveClientPath(virtualPath: string, options?: Options) {
  const encoded = encodePath(virtualPath);

  if (options?.isDeleted) return getClientTrashPath(encoded);

  return getClientExplorerPath(encoded);
}
