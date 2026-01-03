import { KeyAction, ParsedKeyAction } from "@/lib/shortcut-keys/types";
import { matchModifiers, parseShortcut } from "@/lib/shortcut-keys/utils";
import { castArray } from "@/lib/utils/cast-array";
import { useCallback, useEffect, useMemo, useRef } from "react";

export function useShortcutKeys(actions: KeyAction[]) {
  const stack = useRef<ParsedKeyAction[]>([]);

  // 現在のスタックにショートカットキーを追加登録（非公開API）
  const _register_internal = useCallback((action: ParsedKeyAction) => {
    stack.current.push(action);

    // 登録解除用のコールバックを返す
    return () => {
      const i = stack.current.indexOf(action);
      if (i !== -1) stack.current.splice(i, 1);
    };
  }, []);

  // 現在のスタックにショートカットキーを追加登録（公開API）
  const register = useCallback(
    (actions: KeyAction | KeyAction[]) => {
      const unregisters: (() => void)[] = [];

      // 現在のスタックにショートカットキーを追加登録
      castArray(actions).forEach((action) => {
        castArray(action.key).forEach((k) => {
          const { key, modifiers } = parseShortcut(k);

          unregisters.push(
            _register_internal({
              key,
              modifiers,
              callback: action.callback,
              condition: action.condition,
            })
          );
        });
      });

      // 登録解除用のコールバックを返す
      return () => unregisters.forEach((fn) => fn());
    },
    [_register_internal]
  );

  // 登録済みスタックを処理する共通の keydown ハンドラを設定 (LIFO)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLElement &&
        ["INPUT", "TEXTAREA"].includes(e.target.tagName)
      ) {
        return;
      }

      const key = e.key.toLowerCase();

      // 最後に登録されたアクションのみ実行
      // （同じキーが複数登録された場合の対策）
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
       * }, [register]);
       * ```
       */
      register,
    }),
    [register]
  );
}
