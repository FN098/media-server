import { KeyAction, ParsedKeyAction } from "@/lib/shortcut-keys/types";
import { matchModifiers, parseShortcut } from "@/lib/shortcut-keys/utils";
import { castArray } from "@/lib/utils/cast-array";
import { useCallback, useEffect, useMemo, useRef } from "react";

export function useShortcutKeys(actions: KeyAction[]) {
  const stack = useRef<ParsedKeyAction[]>([]);

  const register = useCallback((action: ParsedKeyAction) => {
    stack.current.push(action);
    return () => {
      const idx = stack.current.indexOf(action);
      if (idx !== -1) stack.current.splice(idx, 1);
    };
  }, []);

  // マウント時にキー入力イベントハンドラを登録
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLElement &&
        ["INPUT", "TEXTAREA"].includes(e.target.tagName)
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      for (let i = stack.current.length - 1; i >= 0; i--) {
        const { key: k, modifiers, callback, condition } = stack.current[i];

        if (k !== key) continue;

        const isActive =
          typeof condition === "function" ? condition() : (condition ?? true);
        if (!isActive) continue;
        if (!matchModifiers(e, modifiers)) continue;

        e.preventDefault();
        callback();
        break;
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    const unregisters: (() => void)[] = [];

    actions.forEach((action) => {
      castArray(action.key).forEach((k) => {
        const { key, modifiers } = parseShortcut(k);

        unregisters.push(
          register({
            key,
            modifiers,
            callback: action.callback,
            condition: action.condition,
          })
        );
      });
    });

    return () => {
      unregisters.forEach((fn) => fn());
    };
  }, [actions, register]);

  return useMemo(
    () => ({
      register,
    }),
    [register]
  );
}
