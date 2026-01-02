export const isOutOfBounds = <T>(index: number, arr: readonly T[]) =>
  index < 0 || index >= arr.length;
