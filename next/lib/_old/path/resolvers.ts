import { encodePath } from "@/lib/_old/path/encoder";
import {
    getClientExplorerPath,
    getClientTrashPath,
} from "@/lib/_old/path/helpers";

type Options = {
  isDeleted?: boolean;
};

/** @deprecated */
export function resolveClientPath(virtualPath: string, options?: Options) {
  const encoded = encodePath(virtualPath);

  if (options?.isDeleted) return getClientTrashPath(encoded);

  return getClientExplorerPath(encoded);
}
