import { Modifiers } from "@/lib/shortcut-keys/types";
import { castArray } from "@/lib/utils/cast-array";

export function matchModifiers(
  e: KeyboardEvent,
  modifiers?: Modifiers
): boolean {
  if (!modifiers) return true;

  return castArray(modifiers).some((m) => {
    if (m.ctrl !== undefined && m.ctrl !== e.ctrlKey) return false;
    if (m.meta !== undefined && m.meta !== e.metaKey) return false;
    if (m.shift !== undefined && m.shift !== e.shiftKey) return false;
    if (m.alt !== undefined && m.alt !== e.altKey) return false;
    return true;
  });
}

export function normalizeKey(key: string): string {
  return key.toLowerCase();
}

export function parseShortcut(shortcut: string) {
  const parts = shortcut.split("+");

  const rawKey = parts.pop()!;
  const key = normalizeKey(rawKey);

  const modifiers = {
    ctrl: parts.includes("Ctrl"),
    meta: parts.includes("Cmd"),
    shift: parts.includes("Shift"),
    alt: parts.includes("Alt"),
  };

  return { key, modifiers };
}
