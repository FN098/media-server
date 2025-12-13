import { useEffect } from "react";

type KeyAction = {
  key: string;
  callback: () => void;
  condition?: boolean; // 条件付き
};

export function useShortcutKeys(actions: KeyAction[]) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      actions.forEach(({ key, callback, condition = true }) => {
        if (e.key === key && condition) {
          callback();
        }
      });
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [actions]);
}
