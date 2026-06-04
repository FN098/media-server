import { SeparatorMenuItem } from "@/lib/menu-items/types";

export function createSeparator<T>(key: string): SeparatorMenuItem<T> {
  return { key, type: "separator" };
}
