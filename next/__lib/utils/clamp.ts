export function clamp(val: number, minVal: number, maxVal: number): number {
  return Math.min(maxVal, Math.max(minVal, val));
}
