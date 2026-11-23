import { NodeFilter } from "@/lib/node/types";
import { isMatchJapanese } from "@/lib/utils/japanese";

export type QueryFilterValue = {
  query?: string | null;
};

export function createQueryFilter(value: QueryFilterValue): NodeFilter {
  const trimmed = value.query?.trim();
  return (node) => !trimmed || isMatchJapanese(node.name, trimmed);
}
