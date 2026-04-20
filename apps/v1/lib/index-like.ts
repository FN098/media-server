export type IndexLike = number | "first" | "last";

export function parseIndexLike(at: IndexLike, total: number) {
  if (at === "first") return 0;
  if (at === "last") return total - 1;

  // 数字かもしれない場合
  const index = Number(at);
  if (Number.isNaN(index)) return 0;

  return index;
}
