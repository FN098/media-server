import { useCallback, useState } from "react";

export type UseSelectionOptions<T> = {
  initial?: T[];
  multiple?: boolean; // 複数選択を許可するか
};

export type UseSelectionReturn<T> = {
  selected: Set<T>;
  select: (item: T, additive?: boolean) => void;
  deselect: (item: T) => void;
  toggle: (item: T) => void;
  clear: () => void;
  isSelected: (item: T) => boolean;
};

export function useSelection<T>(
  options: UseSelectionOptions<T> = {}
): UseSelectionReturn<T> {
  const { initial = [], multiple = true } = options;
  const [selected, setSelected] = useState<Set<T>>(new Set(initial));

  // 単体選択
  const select = useCallback(
    (item: T, additive = false) => {
      setSelected((prev) => {
        if (!multiple) return new Set([item]); // 単一選択モード
        const next = new Set(prev);
        if (!additive) next.clear();
        next.add(item);
        return next;
      });
    },
    [multiple]
  );

  // 選択解除
  const deselect = useCallback((item: T) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(item);
      return next;
    });
  }, []);

  // トグル
  const toggle = useCallback((item: T) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });
  }, []);

  // 全解除
  const clear = useCallback(() => setSelected(new Set()), []);

  const isSelected = useCallback((item: T) => selected.has(item), [selected]);

  return { selected, select, deselect, toggle, clear, isSelected };
}
