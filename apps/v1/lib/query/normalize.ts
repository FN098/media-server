import { ExplorerQuery } from "@/lib/query/types";

export function normalizeExplorerQuery(
  query: ExplorerQuery
): Partial<ExplorerQuery> {
  const normalized: Partial<ExplorerQuery> = { ...query };

  if (normalized.view === "grid") {
    delete normalized.view;
  }

  if (!normalized.modal) {
    delete normalized.modal;
  }

  if (normalized.at == null) {
    delete normalized.at;
  }

  if (!normalized.q) {
    delete normalized.q;
  }

  return normalized;
}
