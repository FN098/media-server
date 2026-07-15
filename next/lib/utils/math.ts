export function sum(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0);
}

export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return sum(values) / values.length;
}

export function sumBy<T>(items: T[], selector: (item: T) => number): number {
  return items.reduce((sum, item) => sum + selector(item), 0);
}

export function averageBy<T>(
  items: T[],
  selector: (item: T) => number
): number {
  if (items.length === 0) return 0;
  return sumBy(items, selector) / items.length;
}
