import { ReadonlyURLSearchParams } from "next/navigation";

type QueryValue = string | number | boolean;

export function overrideSearchParams(
  overrides: Record<string, QueryValue | null | undefined>,
  current: ReadonlyURLSearchParams
) {
  const params = new URLSearchParams(current);

  for (const [key, value] of Object.entries(overrides)) {
    if (value === null || value === undefined || value === false)
      params.delete(key);
    else params.set(key, String(value));
  }

  return params;
}
