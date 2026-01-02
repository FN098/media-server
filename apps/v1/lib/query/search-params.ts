type QueryValue = string | number | boolean;

export function toSearchParams(
  obj: Record<string, QueryValue | null | undefined>
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(obj)) {
    if (value == null) continue;
    params.set(key, String(value));
  }

  return params.toString();
}
