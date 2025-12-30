import { getClientExplorerPath } from "@/lib/path-helpers";
import path from "path";

// ユーザーに表示させないパス一覧
export const blackListPrefixes = [getClientExplorerPath(".thumb")];

export const blackListPaths = blackListPrefixes.map((p) =>
  path.posix.normalize(p)
);
