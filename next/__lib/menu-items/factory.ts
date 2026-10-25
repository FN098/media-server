import { SeparatorMenuItem } from "@/__lib/menu-items/types";

export function createSeparator<T>(key: string): SeparatorMenuItem<T> {
  return { key, type: "separator" };
}
