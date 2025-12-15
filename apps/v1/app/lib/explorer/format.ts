export function formatLocalDate(
  value: string | Date | null | undefined,
  fallback = "-"
): string {
  if (!value) return fallback;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;

  const yyyy = date.getFullYear();
  const MM = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");

  return `${yyyy}/${MM}/${dd} ${hh}:${mm}`;
}

export function formatBytes(
  bytes: number | null | undefined,
  fallback = "-"
): string {
  if (bytes == null || bytes < 0) return fallback;

  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;

  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}
