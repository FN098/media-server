import { SeparatorMenuItem } from "@/feature/menu-items/lib/types";

export function createSeparator<T>(key: string): SeparatorMenuItem<T> {
  return { key, type: "separator" };
}
