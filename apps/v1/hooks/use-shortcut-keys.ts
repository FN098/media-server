import { castArray } from "@/lib/utils/cast-array";
import { useEffect, useMemo } from "react";

export const Keys = {
  // 文字キー
  A: "a",
  B: "b",
  C: "c",
  D: "d",
  E: "e",
  F: "f",
  G: "g",
  H: "h",
  I: "i",
  J: "j",
  K: "k",
  L: "l",
  M: "m",
  N: "n",
  O: "o",
  P: "p",
  Q: "q",
  R: "r",
  S: "s",
  T: "t",
  U: "u",
  V: "v",
  W: "w",
  X: "x",
  Y: "y",
  Z: "z",

  // 数字キー
  Digit0: "0",
  Digit1: "1",
  Digit2: "2",
  Digit3: "3",
  Digit4: "4",
  Digit5: "5",
  Digit6: "6",
  Digit7: "7",
  Digit8: "8",
  Digit9: "9",

  // 矢印キー
  ArrowUp: "ArrowUp",
  ArrowDown: "ArrowDown",
  ArrowLeft: "ArrowLeft",
  ArrowRight: "ArrowRight",

  // 制御キー
  Escape: "Escape",
  Enter: "Enter",
  Backspace: "Backspace",
  Tab: "Tab",
  Space: " ",
  Delete: "Delete",
  Home: "Home",
  End: "End",
  PageUp: "PageUp",
  PageDown: "PageDown",
  Insert: "Insert",

  // ファンクションキー
  F1: "F1",
  F2: "F2",
  F3: "F3",
  F4: "F4",
  F5: "F5",
  F6: "F6",
  F7: "F7",
  F8: "F8",
  F9: "F9",
  F10: "F10",
  F11: "F11",
  F12: "F12",

  // 記号キー
  Minus: "-",
  Equal: "=",
  BracketLeft: "[",
  BracketRight: "]",
  Backslash: "\\",
  Semicolon: ";",
  Quote: "'",
  Backquote: "`",
  Comma: ",",
  Period: ".",
  Slash: "/",

  // Numpad
  Numpad0: "0",
  Numpad1: "1",
  Numpad2: "2",
  Numpad3: "3",
  Numpad4: "4",
  Numpad5: "5",
  Numpad6: "6",
  Numpad7: "7",
  Numpad8: "8",
  Numpad9: "9",
  NumpadAdd: "+",
  NumpadSubtract: "-",
  NumpadMultiply: "*",
  NumpadDivide: "/",
  NumpadDecimal: ".",
  NumpadEnter: "Enter",
} as const;

export const Mod = {
  Ctrl: "Ctrl",
  Cmd: "Cmd",
  Shift: "Shift",
  Alt: "Alt",
} as const;

type KeyValue = (typeof Keys)[keyof typeof Keys];
type ModValue = (typeof Mod)[keyof typeof Mod];

type Shortcut =
  | KeyValue
  | `${ModValue}+${KeyValue}`
  | `${ModValue}+${ModValue}+${KeyValue}`
  | `${ModValue}+${ModValue}+${ModValue}+${KeyValue}`;

type Modifiers = {
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
};

type KeyAction = {
  key: Shortcut | readonly Shortcut[];
  callback: () => void;
  condition?: boolean | (() => boolean);
};

type ParsedKeyAction = {
  key: string;
  modifiers: Modifiers;
  callback: () => void;
  condition?: boolean | (() => boolean);
};

function matchModifiers(e: KeyboardEvent, modifiers?: Modifiers): boolean {
  if (!modifiers) return true;

  return castArray(modifiers).some((m) => {
    if (m.ctrl !== undefined && m.ctrl !== e.ctrlKey) return false;
    if (m.meta !== undefined && m.meta !== e.metaKey) return false;
    if (m.shift !== undefined && m.shift !== e.shiftKey) return false;
    if (m.alt !== undefined && m.alt !== e.altKey) return false;
    return true;
  });
}

function normalizeKey(key: string): string {
  return key.toLowerCase();
}

function parseShortcut(shortcut: string) {
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

function castArrayKey(
  key: Shortcut | readonly Shortcut[]
): readonly Shortcut[] {
  // castArray は readonly T[] の推論ができないので as でキャストする
  return Array.isArray(key) ? [...(key as Shortcut[])] : [key as Shortcut];
}

export function useShortcutKeys(actions: KeyAction[]) {
  // キーを Map に変換して O(1) でアクセスできるようにする
  const actionMap = useMemo(() => {
    const map = new Map<string, ParsedKeyAction[]>();
    actions.forEach((action) => {
      castArrayKey(action.key).forEach((k) => {
        const { key, modifiers } = parseShortcut(k);
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push({
          key,
          modifiers,
          callback: action.callback,
          condition: action.condition,
        });
      });
    });
    return map;
  }, [actions]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLElement &&
        ["INPUT", "TEXTAREA"].includes(e.target.tagName)
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      const matchedActions = actionMap.get(key);
      if (!matchedActions) return;

      matchedActions.forEach(({ callback, condition = true, modifiers }) => {
        const isActive =
          typeof condition === "function" ? condition() : condition;

        if (!isActive) return;
        if (!matchModifiers(e, modifiers)) return;

        e.preventDefault();
        callback();
      });
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [actionMap]);
}

export function useShortcutKey(action: KeyAction) {
  useShortcutKeys([action]);
}
