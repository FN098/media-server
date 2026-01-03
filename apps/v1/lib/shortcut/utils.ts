import { Keys } from "@/lib/shortcut/keys";
import { KeyValue, Modifiers, Shortcut } from "@/lib/shortcut/types";

export function matchModifiers(
  e: KeyboardEvent,
  modifiers?: Modifiers
): boolean {
  if (!modifiers) return true;
  if (modifiers.ctrl !== undefined && modifiers.ctrl !== e.ctrlKey)
    return false;
  if (modifiers.meta !== undefined && modifiers.meta !== e.metaKey)
    return false;
  if (modifiers.shift !== undefined && modifiers.shift !== e.shiftKey)
    return false;
  if (modifiers.alt !== undefined && modifiers.alt !== e.altKey) return false;
  return true;
}

export function normalizeKey(key: string): KeyValue {
  const lower = key.toLowerCase();
  const matched = Object.values(Keys).find((k) => k.toLowerCase() === lower);
  if (!matched) throw new Error(`Invalid Key: ${key}`);
  return matched as KeyValue;
}

export function parseShortcut(shortcut: Shortcut) {
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
