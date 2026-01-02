import { IndexLike } from "@/lib/query/types";

export const normalizeIndex = (at: IndexLike, itemCount: number) => {
  if (at === "first") return 0;
  if (at === "last") return itemCount - 1;
  return Number(at);
};
