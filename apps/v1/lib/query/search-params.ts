import { ReadonlyURLSearchParams } from "next/navigation";

type QueryValue = string | number | boolean;

export function toSearchParams(
  obj: Record<string, QueryValue | null | undefined>,
  current?: ReadonlyURLSearchParams
) {
  const params = new URLSearchParams(current);

  for (const [key, value] of Object.entries(obj)) {
    if (value == null) continue;
    params.set(key, String(value));
  }

  return params.toString();
}
