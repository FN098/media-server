import { parse } from "csv-parse/sync";

export function parseCsvEnv(value?: string): string[] {
  if (!value) return [];

  return parse(value, {
    relax_quotes: true,
    skip_empty_lines: true,
  }).flat();
}
