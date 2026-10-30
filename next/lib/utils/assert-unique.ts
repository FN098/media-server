type HasDuplicate<T extends readonly string[]> = T extends readonly [
  infer Head extends string,
  ...infer Rest extends string[],
]
  ? Head extends Rest[number]
    ? true
    : HasDuplicate<Rest>
  : false;

export function assertUnique<const T extends readonly string[]>(
  values: T & (HasDuplicate<T> extends true ? never : unknown)
): T {
  return values;
}
