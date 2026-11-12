export function formatBytes(
  bytes: number,
  options?: {
    fractionDigits?: number;
    trimTrailingZeros?: boolean;
  }
): string {
  if (bytes === 0) return "0 Bytes";

  const { fractionDigits = 2, trimTrailingZeros = true } = options ?? {};

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  const value = bytes / Math.pow(k, i);
  const formatted = value.toFixed(fractionDigits);

  return `${trimTrailingZeros ? Number(formatted) : formatted} ${sizes[i]}`;
}
