"use client";

import { useEffect, useMemo } from "react";

type KeyAction = {
  key: string;
  callback: () => void;
  condition?: boolean | (() => boolean);
};

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
      const matchedActions = actionMap.get(e.key);
      if (!matchedActions) return;

      matchedActions.forEach(({ callback, condition = true }) => {
        const isActive =
          typeof condition === "function" ? condition() : condition;
        if (isActive) {
          e.preventDefault();
          callback();
        }
      });
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [actionMap]);
}

export function useShortcutKey(action: KeyAction) {
  useShortcutKeys([action]);
}
