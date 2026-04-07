import { ReadonlyURLSearchParams } from "next/navigation";

type QueryValue = string | number | boolean;

export function overrideSearchParams(
  overrides: Record<string, QueryValue | null | undefined>,
  current: ReadonlyURLSearchParams
) {
  debugger;
  const params = new URLSearchParams(current);

  for (const [key, value] of Object.entries(overrides)) {
    if (!value) params.delete(key);
    else params.set(key, String(value));
  }

  return params;
}
