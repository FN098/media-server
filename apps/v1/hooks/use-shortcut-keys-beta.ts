import {
  KeyAction,
  ParsedKeyAction,
  ShortcutMap,
} from "@/lib/shortcut/types-beta";
import { matchModifiers, parseShortcut } from "@/lib/shortcut/utils-beta";
import { castArray } from "@/lib/utils/cast-array";
import { useCallback, useEffect, useMemo, useRef } from "react";

export function useShortcutKeys(actions: KeyAction[]) {
  const shortcutMapRef = useRef<ShortcutMap>(new Map());

  /**
   * 非公開API: priority→key→actions 配列に格納
   */
  const _register_internal = useCallback((action: ParsedKeyAction) => {
    const priority = action.priority ?? 0;
    const key = action.key;

    if (!shortcutMapRef.current.has(priority))
      shortcutMapRef.current.set(priority, new Map());
    const actionMap = shortcutMapRef.current.get(priority)!;

    if (!actionMap.has(key)) actionMap.set(key, []);
    const actions = actionMap.get(key)!;
    actions.push(action);

    return () => {
      const i = shortcutMapRef.current.get(priority)?.get(key)?.indexOf(action);
      if (i !== undefined && i !== -1)
        shortcutMapRef.current.get(priority)?.get(key)?.splice(i, 1);
    };
  }, []);

  /**
   * 公開API: KeyAction 配列で登録可能
   */
  const register = useCallback(
    (actions: KeyAction | KeyAction[]) => {
      const unregisters: (() => void)[] = [];

      castArray(actions).forEach((action) => {
        castArray(action.key).forEach((k) => {
          const { key, modifiers } = parseShortcut(k);

          unregisters.push(
            _register_internal({
              key,
              modifiers,
              callback: action.callback,
              condition: action.condition,
              priority: action.priority,
            })
          );
        });
      });

      return () => unregisters.forEach((fn) => fn());
    },
    [_register_internal]
  );

  /**
   * keydown ハンドラ: priority 高い順 → LIFO
   */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLElement &&
        ["INPUT", "TEXTAREA"].includes(e.target.tagName)
      ) {
        return;
      }

      const key = e.key;

      // priority 高い順で取得
      const priorities = [...shortcutMapRef.current.keys()].sort(
        (a, b) => b - a
      );

      for (const p of priorities) {
        const actionMap = shortcutMapRef.current.get(p)!;
        const actions = actionMap.get(key);
        if (!actions) continue;

        // LIFO: 最後に登録されたものを優先
        for (let i = actions.length - 1; i >= 0; i--) {
          const { modifiers, callback, condition } = actions[i];
          if (!matchModifiers(e, modifiers)) continue;
          const isActive =
            typeof condition === "function" ? condition() : (condition ?? true);
          if (!isActive) continue;

          e.preventDefault();
          callback();
          return;
        }
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // 外部から渡されたショートカットキーアクションを登録
  useEffect(() => {
    return register(actions);
  }, [actions, register]);

  return useMemo(
    () => ({
      /**
       * @example
       * ```tsx
       * const { register } = useShortcutContext();
       *
       * useEffect(() => {
       *   return register([
       *     {
       *       key: ["i", "Ctrl+i"],
       *       callback: openInput,
       *     },
       *     {
       *       key: "Escape",
       *       callback: close,
       *       condition: isOpen,
       *     },
       *   ]);
       *   // eslint-disable-next-line react-hooks/exhaustive-deps
       * }, []);
       * ```
       */
      register,
    }),
    [register]
  );
}
