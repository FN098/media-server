"use client";

import { castArray } from "@/app/lib/utils/cast-array";
import { useEffect, useMemo } from "react";

type Modifiers = {
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
};

type KeyAction = {
  key: string;
  modifiers?: Modifiers | Modifiers[];
  callback: () => void;
  condition?: boolean | (() => boolean);
};

function matchModifiers(e: KeyboardEvent, modifiers?: Modifiers | Modifiers[]) {
  if (!modifiers) return true;

  return castArray(modifiers).some((m) => {
    if (m.ctrl !== undefined && m.ctrl !== e.ctrlKey) return false;
    if (m.meta !== undefined && m.meta !== e.metaKey) return false;
    if (m.shift !== undefined && m.shift !== e.shiftKey) return false;
    if (m.alt !== undefined && m.alt !== e.altKey) return false;
    return true;
  });
}

export function useShortcutKeys(actions: KeyAction[]) {
  // キーを Map に変換して O(1) でアクセスできるようにする
  const actionMap = useMemo(() => {
    const map = new Map<string, KeyAction[]>();
    actions.forEach((action) => {
      if (!map.has(action.key)) map.set(action.key, []);
      map.get(action.key)!.push(action);
    });
    return map;
  }, [actions]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
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
